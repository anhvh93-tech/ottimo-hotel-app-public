# Hướng dẫn Sale nội bộ và CTV / môi giới – OTTIMO Desk v1.0

- Dành cho: **sale nội bộ (SAL)** – nhân viên bán hàng của OTTIMO; **CTV / môi giới** – cộng tác viên ngoài
- Thiết bị: **điện thoại hoặc máy tính**, địa chỉ `desk.ottimo.vn`
- Áp dụng cho: **OTTIMO Desk v1.0** (bản `v1.0.0`), chạy thật từ **thứ Hai 02/11/2026**
- Lập: BA · 30/10/2026 · Bộ hướng dẫn theo bộ phận, bản 1.1 (tách từ Sổ tay sử dụng OTTIMO Desk v1.0, bản nội dung 1.5; sửa theo review DOM, SEC, UXD, QA ngày 30/10)
- Tài liệu không chứa mật khẩu, số tài khoản hay thông tin khách.
- **Tài liệu nội bộ OTTIMO – không chuyển tiếp cho người ngoài OTTIMO, không gửi vào nhóm chat, không chụp, không đăng lên mạng. Nghỉ việc hoặc hết hợp tác: xóa tệp trên máy và báo chủ đầu tư.** Bộ hướng dẫn chỉ do chủ đầu tư gửi, và không bao giờ có ô đăng nhập hay hỏi mật khẩu; tệp "hướng dẫn" nhận từ người khác thì không mở, báo chủ đầu tư.

<!-- Nguồn: product/docs/manual/user-manual-v1.0.md bản 1.5 mục 0.2, 0.4, 0.7, 0.8, 2.4 (báo giá, giữ chỗ, câu chống giả danh, giữ chỗ quá hạn – đơn CTV), 2.8 (hủy giữ chỗ), 2.13, 4.2, 5.2, 5.3, 5.8. -->

## Cách đọc tệp này

- Chữ **in đậm** là tên nút, tên màn hình đúng như trên Desk. Ảnh màn hình có mã ở dưới ảnh (ví dụ C2-05). Khung nét đứt ghi **Chưa có ảnh** hoặc **Ảnh mới · chờ chụp** là ảnh đang chờ chụp: cứ làm theo chữ.
- Mục ghi **Sale nội bộ** hoặc **CTV** là việc riêng của vai đó. Không ghi gì là cả hai vai.
- Khung **Tạm ở v1.0** là việc Desk chưa làm được và cách làm thay. Cách tạm tới bản v1.0.1 gom ở **mục 8**.
- Con số (giá, %, giờ) theo tham số ngày 27/10/2026. **Báo giá cho khách luôn lấy số Desk tính**, không lấy số trong tệp này.

---

## 1. Đăng nhập

### 1.1 Anh/chị đăng nhập ở đâu

- Địa chỉ: `desk.ottimo.vn` (**OTTIMO Desk**). Dùng được trên **điện thoại** hoặc **máy tính**, trình duyệt Chrome hoặc Safari.
- Chỉ vào bằng cách **gõ địa chỉ** hoặc **dấu trang**. Không bấm link đăng nhập gửi qua Zalo, email, tin nhắn.
- Sale/CTV **không** dùng app nhân viên `staff.ottimo.vn`.
- Mỗi người **một tài khoản** do chủ đầu tư tạo. Không dùng chung, kể cả với người trong cùng nhóm CTV.

### 1.2 Lần đầu đăng nhập

Chủ đầu tư **đưa mật khẩu tạm tận tay**. Không gửi qua chat.

1. Mở trình duyệt, gõ `desk.ottimo.vn`.
2. Nhập **Tên đăng nhập** và **Mật khẩu** (mật khẩu tạm). Bấm **Đăng nhập**.
3. Desk mở **Đặt mật khẩu của bạn**. Nhập **Mật khẩu hiện tại** (mật khẩu tạm).
4. Nhập **Mật khẩu mới** và **Nhập lại mật khẩu mới**.
5. Bấm **Lưu và vào ứng dụng**.
6. Desk mở **Báo giá & giữ chỗ**.
7. Trình duyệt hỏi **Lưu mật khẩu?**: chọn **Không bao giờ**.

[ẢNH: C0-01-Đăng nhập Desk]
[ẢNH: C0-02-Đặt mật khẩu lần đầu]
[ẢNH: G5-01-Đăng nhập Desk trên điện thoại]

Quy tắc mật khẩu: ít nhất 10 ký tự, không chứa tên hoặc số điện thoại của mình, không phải mật khẩu phổ biến. Sale/CTV không cần đăng nhập 2 bước.

> **Trước ngày chạy 02/11:** trên Desk thật chỉ **đăng nhập, đổi mật khẩu tạm, đăng xuất**. Không tạo báo giá hay giữ chỗ thử. Tập trên **Desk tập** (mục 11).

### 1.3 Đăng nhập hằng ngày

1. Gõ `desk.ottimo.vn` (hoặc mở dấu trang).
2. Nhập **Tên đăng nhập**, **Mật khẩu**. Bấm **Đăng nhập**.
3. Desk mở **Báo giá & giữ chỗ**.

Desk có thể báo:

| Desk báo | Làm gì |
|---|---|
| "Tên đăng nhập hoặc mật khẩu không đúng. Quên mật khẩu? Nhờ chủ đầu tư đặt lại." | Gõ lại chậm, kiểm chữ hoa. Vẫn sai: báo chủ đầu tư |
| "Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại." | Chờ đúng số phút |
| "Phiên đăng nhập đã hết" | Đăng nhập lại; thông tin đang nhập vẫn được giữ trên máy đó |
| "Bạn không có quyền mở trang này" | Trang dành cho vai khác. Bấm **Về trang chủ của tôi** |

### 1.4 Menu của anh/chị

| Mục | Sale nội bộ | CTV |
|---|:-:|:-:|
| **Báo giá & giữ chỗ** (tab **Căn trống**, **Báo giá**) | Có | Có |
| **Đơn của tôi** | Có | Có |
| **Khách của tôi** | Có | Có |
| **Yêu cầu từ website** | Có | – |
| **Danh mục căn** (chỉ xem) | Có | Có |

Sale/CTV chỉ thấy đơn và khách **của mình**. Không thấy giấy tờ khách, không đặt đơn đã đảm bảo trực tiếp. Đây là thiết kế, không phải lỗi.

### 1.5 Đăng xuất

1. Bấm **tên của mình** ở góc trên bên phải.
2. Bấm **Đăng xuất**.

Rời máy thì đăng xuất, nhất là máy dùng chung hoặc máy quầy. Menu dưới tên của mình có thêm **Đổi mật khẩu**, **Ngôn ngữ giao diện**, **Giao diện**.

[ẢNH: C0-06-Menu Tài khoản]

### 1.6 Quên mật khẩu, mất điện thoại

| Tình huống | Làm gì |
|---|---|
| Quên mật khẩu | **Báo chủ đầu tư.** Desk không có nút "quên mật khẩu". Chủ đầu tư **Đặt lại mật khẩu**, đưa mật khẩu tạm tận tay |
| Tài khoản bị khóa do sai nhiều lần | Chờ đúng số phút Desk báo, hoặc nhờ chủ đầu tư **Mở khóa**. Bị khóa mà mình **không** gõ sai: báo chủ đầu tư ngay (có thể có người dò mật khẩu) |
| **Mất điện thoại** đang đăng nhập Desk | **Báo chủ đầu tư ngay** để đặt lại mật khẩu (Desk đăng xuất trên mọi máy) hoặc khóa tài khoản |
| Nghi người khác biết mật khẩu | Đổi mật khẩu ngay (**tên của mình → Đổi mật khẩu**) và báo chủ đầu tư |
| Nghỉ việc, hết hợp tác | Đăng xuất, báo chủ đầu tư khóa tài khoản |

**Không ai** – chủ đầu tư, quản lý, đội kỹ thuật, ngân hàng hay OTA – hỏi mật khẩu của anh/chị. Ai hỏi thì không đưa và báo chủ đầu tư.

---

## 2. Việc mỗi ngày

| Khi nào | Việc |
|---|---|
| Đầu ngày | Mở **Đơn của tôi**: xem giữ chỗ nào sắp hết hạn, đơn nào khách đã chuyển cọc |
| Khi khách hỏi giá | Báo giá trên Desk, sao chép gửi khách (mục 3) |
| Khi khách đồng ý | Giữ chỗ (mục 4). Gửi mã VietQR cọc: **sale nội bộ** gửi từ tài khoản OTTIMO trên điện thoại cơ sở (ngoài quầy thì nhờ người trực, mục 5.1); **CTV** báo khách mã cọc do OTTIMO gửi, nhờ lễ tân gửi thẳng cho khách (mục 5.2) |
| Desk nhắc **Giữ chỗ sắp hết hạn** (2 giờ trước hạn) | Liên hệ khách ngay. Cần thêm giờ: **Gia hạn giữ chỗ (1 lần)** trước hạn |
| Khách báo đã chuyển cọc | **Sale nội bộ**: kiểm tiền về rồi **Xác nhận đã nhận cọc** (mục 5.1). **CTV**: **Báo đã chuyển cọc** (mục 5.2) |
| Người trực quầy nhắn về giữ chỗ quá hạn của mình | Liên hệ khách và trả lời người trực **trong 1 giờ** (mục 8.1) |
| Thu hộ tiền mặt | Nộp quầy trong ngày (mục 5.3) |
| **Sale nội bộ**, khi chủ đầu tư bật form website (dự kiến sáng 31/10) | **Yêu cầu từ website**: trả lời trong 15 phút, trong 08:00–21:00 (mục 6.3) |
| Nhắn khách | Chỉ trong **08:00–21:00** |
| Rời máy | **Đăng xuất** |

Luôn nhớ:
- Báo giá giữ giá **3 ngày**. Giữ chỗ chưa cọc thì Desk **tự hủy** khi hết hạn (ở v1.0, giữ chỗ có yêu cầu giảm giá/FOC thì người trực quầy hủy tay).
- Nội dung chuyển khoản luôn là **mã đơn**. CTV không gửi mã VietQR và không xác nhận cọc.
- Không hứa giá, khuyến mãi hay chính sách hủy khác với Desk.
- Không chụp, không xin ảnh giấy tờ của khách. Lễ tân lo giấy tờ khi khách đến.
- Khách ở từ 28 đêm, khách đến hôm nay: nhắn lễ tân.

---

## 3. Báo giá

1. **Báo giá & giữ chỗ**, tab **Căn trống**.
2. Nhập **Ngày đến**, **Số đêm**, **Người lớn (từ 12 tuổi)**, trẻ em.
3. Chọn căn trong danh sách căn trống. Desk mở **Báo giá**: số đêm thường, số đêm thứ Sáu/thứ Bảy, giảm theo số đêm, phụ thu người, **Tổng tiền đơn**, **Cọc để giữ phòng** (30 % tiền phòng), và **Bạn nhận (…% tiền phòng)** (CTV 8 %, sale 3 %).
4. Chọn **Khách đứng tên** ngay trong hộp này (tìm, hoặc **Tạo nhanh khách**: họ tên, **Số điện thoại / Zalo**; đơn Trực tiếp và CTV **bắt buộc có số điện thoại**).
5. Bấm **Lưu báo giá**.
6. Chọn **Ngôn ngữ gửi khách** (Tiếng Việt, English, Русский). Bấm **Sao chép gửi Zalo**. Dán vào tin nhắn riêng với khách.
7. Báo giá giữ giá **3 ngày**. Hết hạn: **Gửi quản lý gia hạn**, hoặc **Lập báo giá mới**.

[ẢNH: C2-03-Báo giá, tab căn trống]
[ẢNH: C2-04-Hộp báo giá]
[ẢNH: C4-06-Báo giá trên điện thoại]

Quy tắc giá Desk tự tính (để trả lời khách, không tự tính tay):
- Đêm thứ Sáu, thứ Bảy +15 %. Ngày đặc biệt +30 % (Tết, lễ, cuối năm).
- Ngày đến thứ Sáu, thứ Bảy, ngày đặc biệt: **tối thiểu 2 đêm**. Desk báo "Ngày này cần ở tối thiểu 2 đêm" thì chọn 2 đêm.
- Từ 7 đêm giảm 10 %, từ 14 đêm giảm 15 %. Từ 28 đêm là **thuê dài hạn**: hợp đồng vẫn làm ngoài app; nhắn lễ tân giữ phòng bằng đơn dài hạn nhập tay.
- Người thêm vượt định mức: người lớn 150.000 đ/đêm, trẻ 6–11 tuổi 100.000 đ/đêm, dưới 6 tuổi miễn.
- Nhận phòng từ 12:00, trả phòng trước 12:00. Câu nói với khách: "Check-in is from 12:00. Your room is always ready by 14:00." / "Nhận phòng từ 12:00. Phòng luôn sẵn sàng lúc 14:00." **Không** hứa "phòng sẵn sàng từ 12:00".

**Chính sách hủy** (kênh Trực tiếp, CTV) – đọc đúng như sau khi khách hỏi:
- Báo trước từ 7 ngày: hoàn 100 % cọc. 3–6 ngày: hoàn 50 %. Dưới 3 ngày: không hoàn.
- **Đơn có đêm ngày đặc biệt: không hoàn cọc.**
- Không hứa khác Desk.

---

## 4. Giữ chỗ

### 4.1 Tạo giữ chỗ

1. Trong báo giá, bấm **Khách đồng ý – Giữ chỗ**.
2. Hộp **Giữ chỗ**: chọn **Giữ trong** 12 h, 24 h hoặc 48 h (mặc định 24). Hạn giữ không vượt 12:00 ngày đến. Tới v1.0.1: chọn thời hạn để giờ hết hạn rơi vào **09:00–21:00**. Ví dụ tạo lúc 15:00: chọn **24 h** (hạn 15:00 hôm sau), không chọn 12 h (hạn 03:00 sáng).
3. Bấm **Tạo giữ chỗ**. Desk tạo đơn **Giữ chỗ · chờ cọc** và mã **VietQR** đúng số cọc, nội dung chuyển khoản là **mã đơn**.
4. Gửi mã cọc cho khách theo mục 5.

[ẢNH: C2-05-Giữ chỗ và mã VietQR cọc]

- Số giữ chỗ mở cùng lúc: **CTV tối đa 3**, **sale tối đa 5**. Nhóm lớn hơn thì nhờ lễ tân tạo.
- Khách đến **hôm nay**: không giữ chỗ được. Nhắn lễ tân tạo đơn đã thu cho khách.
- Một khách đặt nhiều căn: mỗi căn một giữ chỗ (mỗi căn một đơn), mỗi đơn một mã VietQR.

### 4.2 Gia hạn, hủy giữ chỗ của mình

Khung đơn giữ chỗ của mình có **Hủy giữ chỗ** và **Gia hạn giữ chỗ (1 lần)**.
- **Gia hạn giữ chỗ (1 lần)**: tối đa thêm 24 giờ, không quá 12:00 ngày đến. **Chỉ làm trước hạn**; sau hạn nút này không còn.
- **Hủy giữ chỗ**: hộp **Hủy giữ chỗ căn …?** → **Lý do hủy** → **Hủy giữ chỗ**. Ở v1.0 **không chọn Khác (ghi rõ)** (mục 8.2).
- **Chỉ tự hủy** giữ chỗ của mình khi trên đơn **Đã nhận** là **0 đ** **và không có** dòng **CTV/sale đã báo chuyển cọc**.
- Mọi trường hợp khác **không tự hủy**: khách đã chuyển một phần hay đủ, anh/chị đã **Báo đã chuyển cọc**, khách nói "đã chuyển" mà Desk chưa thấy, hoặc đơn đã **Đã xác nhận**. Nhắn lễ tân ngay:
  - **mã đơn**;
  - khách báo hủy **ngày nào, mấy giờ, qua kênh nào** (Zalo, điện thoại);
  - lý do khách nói (không ghi tên khách).
- Không hứa số tiền hoàn. Nói với khách: lễ tân OTTIMO sẽ báo số hoàn theo chính sách hủy.
- Vì sao: hủy đơn có tiền tạo yêu cầu hoàn. Nơi nhận hoàn chỉ nhập được trên máy quầy đã cấp quyền, chủ đầu tư duyệt và chi. Mức hoàn tính theo ngày khách báo, nên giờ khách báo phải tới lễ tân sớm nhất.
- Khung đơn giữ chỗ hiện **Tạo link check-in online**: **không bấm**. Sale/CTV không cấp hay gửi link check-in online (mục 8.3).

### 4.3 Giữ chỗ tới hạn – Desk tự làm gì

- **Chưa cọc:** Desk tự hủy trong khoảng 1 phút sau hạn, nhả căn, không phí. Riêng giữ chỗ có yêu cầu giảm giá/FOC thì không tự hủy: người trực quầy hủy tay.
- **Đã nhận cọc (đủ hoặc thiếu):** Desk **không** tự hủy. Người trực quầy xử lý (mục 8.1).

---

## 5. Cọc

### 5.1 Sale nội bộ

**Gửi mã cọc:**
1. Chỉ gửi mã **Desk tạo cho đúng đơn** (**Sao chép số tiền**, **Sao chép nội dung** nếu khách tự gõ).
2. Gửi kèm câu:
   - "OTTIMO only messages you from this account and your OTA inbox, and never changes bank details by message."
   - "OTTIMO chỉ nhắn từ tài khoản này và hộp thư OTA, không bao giờ đổi số tài khoản qua tin nhắn."
3. Nhắn từ tài khoản Zalo/số điện thoại của OTTIMO **trên điện thoại của cơ sở**. Không nhắn khách từ Zalo cá nhân. Không đăng nhập Zalo của OTTIMO trên điện thoại hay máy tính cá nhân (kể cả Zalo PC, Zalo Web). **Làm việc ngoài quầy:** gọi hoặc nhắn người trực **chỉ mã đơn** (không kèm tên, số điện thoại của khách); người trực gửi mã cọc từ tài khoản OTTIMO. Không tự gửi.
4. Không gửi ảnh QR cũ, không gõ số tài khoản bằng tay.
5. Mã hiện dòng **"Tài khoản nhận vừa đổi"**: **chưa gửi**, **gọi điện** (không nhắn) chủ đầu tư xác nhận trước. Chủ đầu tư xác nhận thì mới gửi.

**Xác nhận đã nhận cọc:**
1. **Chỉ xác nhận khi chắc tiền đã về tài khoản OTTIMO**: gọi hoặc nhắn chủ đầu tư/quản lý **qua số đã lưu sẵn** (07:00–22:00), kèm **mã đơn và số tiền**. Chỉ bấm khi người đó trả lời **đúng mã đơn và số tiền**. Tin xác nhận đến từ số hoặc tài khoản lạ thì không tin.
2. Ảnh chụp màn hình hay SMS chuyển khoản của khách **không** thay xác nhận.
3. Mở đơn → **Xác nhận đã nhận cọc**. Hộp **Xác nhận cọc · OTM-…**: kiểm **Số tiền đã nhận** và **Cách thanh toán**. Bấm **Xác nhận đã nhận cọc**.
4. Bấm **trước giờ hạn** giữ chỗ. Sau hạn Desk từ chối, kể cả khi tiền về trước hạn.
5. Khoản do sale ghi ở trạng thái **chờ đối soát**; quản lý đối soát trong ngày.

[ẢNH: C2-06-Xác nhận đã nhận cọc]

- Khách chuyển thiếu: Desk ghi được số đã nhận; đơn vẫn **Giữ chỗ · chờ cọc**. Gọi khách ngay trong ngày xin phần còn lại **trước hạn**. Desk v1.0 chưa có "Chấp nhận cọc thiếu".
- Ghi mã giao dịch ngân hàng (nếu có) báo lễ tân ghi sổ giao ca (hộp xác nhận chưa có ô mã giao dịch).

### 5.2 CTV

- Khi khách đồng ý giữ chỗ, báo khách trước: mã cọc sẽ do **OTTIMO gửi từ tài khoản OTTIMO**, nội dung chuyển khoản là mã đơn, và **không chuyển tiền cọc cho CTV**. Không gửi số tài khoản, không chụp lại hay chuyển tiếp mã QR cho khách. Câu nói với khách:
  - EN: "Your deposit QR will come from the official OTTIMO account, with your booking code as the reference. Please pay only to that QR, not to me."
  - VI: "Mã QR đặt cọc sẽ do tài khoản chính thức của OTTIMO gửi, nội dung là mã đặt phòng. Anh/chị vui lòng chỉ chuyển theo mã đó, không chuyển cho tôi."
- **Không gửi mã VietQR, không xác nhận cọc.** Nhắn lễ tân **mã đơn** để lễ tân gửi mã VietQR thẳng cho khách từ tài khoản OTTIMO.

<!-- Câu EN/VI ở trên là bản nháp SEC (SEC G06), chờ UXD chốt theo brand guideline (DOM G16). -->
- Khách báo đã chuyển:
  1. Mở đơn → **Báo đã chuyển cọc**.
  2. Nhập **Số tiền khách chuyển**, **Ghi chú**.
  3. **Đính kèm ảnh biên nhận** (không bắt buộc; JPG, PNG, WebP, tối đa 10 MB).
  4. Gửi.
- Lễ tân hoặc sale nội bộ kiểm tiền về rồi xác nhận. Khung đơn ở quầy hiện **CTV/sale đã báo chuyển cọc**.

[ẢNH: C4-07-Báo đã chuyển cọc]

### 5.3 Tiền mặt thu hộ

- Sale/CTV thu hộ tiền mặt: **nộp quầy** trong ngày. Lễ tân bấm **Đã nhận tiền mặt** ở **Nhật ký tiền → Chờ đối soát** và ghi sổ giao ca.
- Hoa hồng thành "đạt" sau khi khoản này được đối soát.
- **Không nhận số thẻ thanh toán** của khách qua điện thoại, Zalo, email hay giấy. Khách muốn trả thẻ thì trả tại máy POS ở quầy.

---

## 6. Đơn của tôi, khách của tôi, yêu cầu từ website

### 6.1 Đơn của tôi

Xem trạng thái đơn mình chốt: **Giữ chỗ · chờ cọc**, **Đã xác nhận**, **Đang ở**, **Đã trả phòng**. Đơn còn hiệu lực có dòng **Hoa hồng dự kiến của bạn** (đơn đã hủy thì không có).

[ẢNH: C4-08-Đơn của tôi, hoa hồng dự kiến]

> **Tạm ở v1.0:** chưa có màn hoa hồng theo đợt chi (dự kiến v1.3); chủ đầu tư chi như hiện nay. Chưa có bảng theo dõi khách tiềm năng, chưa có mẫu tin nhắn (dự kiến v1.2): nhắn tay trong 08:00–21:00 (câu giờ nhận phòng ở mục 3, câu chống giả danh ở mục 5.1).

### 6.2 Khách của tôi

Trang **Khách hàng** (menu **Khách của tôi**) trống tới khi tìm: gõ ít nhất 2 ký tự của tên, mã KH hoặc SĐT vào ô **Tìm khách**. Kết quả có **MÃ KH**, **HỌ TÊN**, **LIÊN HỆ** (số điện thoại che giữa), **QUỐC TỊCH**, **NHÓM KHÁCH**; nút **Thêm khách**. Chỉ thấy khách mình đã tạo. Không có giấy tờ. Không ghi số giấy tờ, số thẻ, thông tin sức khỏe vào ghi chú.

[ẢNH: G5-02-Khách của tôi]

### 6.3 Yêu cầu từ website (sale nội bộ)

Form "Yêu cầu đặt phòng" trên ottimo.vn **dự kiến bật sáng 31/10** (luật sư đã đồng ý 30/10, đội đang chuẩn bị). **Chủ đầu tư báo khi đã bật.** Chưa bật thì màn hiện "Form đặt phòng trên website đang tắt"; khách liên hệ qua Zalo, điện thoại.

Khi form bật: yêu cầu mới hiện ở menu kèm số. Mở yêu cầu → **Nhận xử lý** → **Báo giá**; không thành đơn thì **Đóng – không thành đơn**.

> **Tạm ở v1.0 (tới v1.0.1 có tin báo qua Google Chat):** Desk chưa báo yêu cầu mới ra ngoài màn hình. Khi form bật:
> - Desk mở trên máy quầy và điện thoại người trực **07:00–22:00**. Sale nội bộ đang làm việc thì xem **Yêu cầu từ website** mỗi lần cầm máy.
> - Hạn trả lời 15 phút áp trong **08:00–21:00**. Trả lời khách từ tài khoản OTTIMO trên điện thoại cơ sở (mục 5.1).
> - Yêu cầu tới ngoài giờ: bấm **Nhận xử lý** khi thấy, nhắn khách từ 08:00 sáng hôm sau.

[ẢNH: C2-39-Yêu cầu từ website, form tắt]

---

## 7. Tình huống thường gặp và không được làm

### 7.1 Tình huống thường gặp

| Tình huống | Làm gì |
|---|---|
| Khách hỏi "giữ phòng cho tôi, chiều chuyển cọc" | Giữ chỗ 12 h hoặc 24 h, gửi mã cọc ngay |
| Báo giá hết hiệu lực, khách mới đồng ý | **Gửi quản lý gia hạn**, hoặc **Lập báo giá mới** theo giá hiện hành |
| Desk báo đã đủ số giữ chỗ (CTV 3, sale 5) | Nhờ lễ tân tạo |
| Khách đến hôm nay | Nhắn lễ tân tạo đơn |
| Khách ở từ 28 đêm | Nhắn lễ tân; hợp đồng làm ngoài app |
| Khách xin gửi ảnh giấy tờ trước | Không nhận. Báo khách lễ tân làm giấy tờ tại quầy khi khách đến |
| Khách xin mã cửa, Wi-Fi | Sale/CTV không có mã cửa. Mã cửa lễ tân giao khi nhận phòng |
| Khách gửi số thẻ qua tin nhắn | Không dùng, không ghi lại. Mời khách trả tại máy POS ở quầy |
| Khách hỏi giảm giá ngoài Desk | Không hứa. Hỏi lễ tân/quản lý |
| Mã VietQR hiện "Tài khoản nhận vừa đổi" | Chưa gửi. Gọi chủ đầu tư (mục 5.1) |
| Desk lỗi, không báo giá được | Ghi bằng lời: giờ, đã bấm gì, Desk báo gì, mã tham chiếu. Báo chủ đầu tư. Không chụp màn hình có tên khách |

### 7.2 Không được làm

- Không dùng chung tài khoản, không đưa mật khẩu cho người khác.
- Không hứa giá, khuyến mãi hay chính sách hủy khác với Desk.
- Không chụp, không xin ảnh giấy tờ của khách.
- Không gửi ảnh QR cũ, không gõ số tài khoản bằng tay. CTV không gửi QR, không xác nhận cọc.
- Không xác nhận cọc khi chưa chắc tiền về; không tin ảnh chụp, SMS của khách.
- Không nhận số thẻ thanh toán.
- Không tự hủy đơn của mình khi đơn đã có tiền hoặc đã báo chuyển cọc (mục 4.2).
- Không nhận tiền cọc, tiền phòng vào tài khoản của mình; không đưa khách số tài khoản nào.
- Không tạo, không gửi link check-in online.
- Không gửi thông tin khách vào nhóm Zalo; không chụp màn hình có dữ liệu khách để gửi ai.
- Không nhắn khách ngoài 08:00–21:00.

---

## 8. Tạm thời tới v1.0.1

Các việc dưới đây làm theo cách tạm tới khi chủ đầu tư báo bản v1.0.1 đã lên (dự kiến 04/11).

### 8.1 Giữ chỗ của anh/chị quá hạn – người trực sẽ nhắn

Desk chưa báo giữ chỗ quá hạn, nên người trực quầy rà **3 mốc mỗi ngày** (mở quầy muộn nhất 09:00 · 11:00 · đóng quầy muộn nhất 21:00).
- Giữ chỗ của anh/chị hết hạn trong đêm (21:00–09:00): xử lý **trước 21:00**. Xác nhận cọc nếu tiền đã về, hoặc **Gia hạn giữ chỗ (1 lần)** sang sau 09:00. Không để khách chuyển cọc sau 21:00 cho giữ chỗ hết hạn trong đêm.
- Giữ chỗ **chưa cọc** đã quá hạn (thường là đơn có yêu cầu giảm giá/FOC): người trực **hủy ngay**, rồi nhắn anh/chị.
- **CTV**: người trực nhắn anh/chị trước. Anh/chị liên hệ khách và trả lời người trực **trong 1 giờ**. Quá 1 giờ, hoặc đã 11:00 ngày đến, người trực gọi thẳng số khách trên đơn.
- Khách còn muốn đến từ ngày mai: tạo **giữ chỗ mới**, chọn **12 h** nếu hạn rơi trước 21:00; nếu không thì chọn **24 h** (mục 4.1). Báo giá cũ còn hiệu lực (3 ngày): bấm lại **Khách đồng ý – Giữ chỗ** từ báo giá đó; hết hiệu lực thì **Lập báo giá mới**. **Chỉ tạo lại một lần** cho cùng khách, cùng kỳ ở.
- Khách muốn đến hôm nay: nhắn lễ tân.
- Giữ chỗ **đã có cọc** quá hạn: người trực gọi khách và xử lý. Desk chỉ còn **Hủy giữ chỗ**; không gia hạn, không xác nhận cọc được sau hạn. Vì vậy **xác nhận cọc và gia hạn trước hạn**.

### 8.2 Không dùng lý do hủy "Khác (ghi rõ)"

Chọn **Khác (ghi rõ)** thì hộp hủy khóa nút. Chọn **Khách đổi ý**, **Khách tìm được chỗ khác**, **Giá chưa phù hợp**, **Đổi ngày** hoặc **Không liên lạc được**. Cần giải thích thêm: nhắn lễ tân ghi sổ giao ca, không ghi tên khách.

### 8.3 Check-in online tạm dừng

Không ai tạo hay gửi link check-in online cho khách thật. Mọi khách làm giấy tờ tại quầy. Khách hỏi: báo khách làm thủ tục tại quầy khi đến.

---

## 9. Bảng giờ

| Giờ | Việc |
|---|---|
| **08:00–21:00** | Khung giờ được nhắn khách |
| 07:00–22:00 | Sale nội bộ hỏi chủ đầu tư/quản lý kiểm tiền về |
| Hạn giữ chỗ − 2 giờ | Desk nhắc **Giữ chỗ sắp hết hạn**: liên hệ khách |
| **Trước 21:00** | Giữ chỗ của mình hết hạn trong đêm (21:00–09:00) đã xác nhận cọc hoặc gia hạn (mục 8.1) |
| **12:00 ngày đến** | Trần hạn giữ chỗ. Nhận phòng từ 12:00 |
| **14:00** | Phòng luôn sẵn sàng |
| 3 ngày từ khi báo giá | Báo giá hết hiệu lực |
| 1 giờ từ khi người trực nhắn (CTV) | Hạn trả lời về giữ chỗ quá hạn |

---

## 10. Khi có sự cố – gọi ai

| Sự cố | Gọi ai |
|---|---|
| Desk báo lỗi, không báo giá / giữ chỗ được, số tiền lạ | Chủ đầu tư (ghi bằng lời: giờ, đã bấm gì, Desk báo gì, mã tham chiếu; không ghi tên khách) |
| Mã VietQR hiện "Tài khoản nhận vừa đổi" | Chủ đầu tư, **gọi điện** |
| Cần biết tiền cọc đã về chưa | Sale nội bộ: chủ đầu tư/quản lý. CTV: lễ tân |
| Cần gia hạn báo giá, giảm giá | Quản lý / chủ đầu tư |
| Khách đến hôm nay, khách dài hạn, nhóm lớn | Lễ tân |
| Quên mật khẩu, mất điện thoại, tài khoản bị khóa | Chủ đầu tư |
| Nghi lộ mật khẩu, thấy tài khoản lạ đăng nhập | Chủ đầu tư ngay |

Số điện thoại lễ tân và chủ đầu tư: chủ đầu tư đưa khi tạo tài khoản. Không gọi số lạ gửi qua tin nhắn.

---

## 11. Bài tập đào tạo (45 phút)

Tập trên **Desk tập** bằng **tài khoản tập** chủ đầu tư đưa tận tay. Mật khẩu tập khác mật khẩu thật. Chỉ mở Desk tập bằng địa chỉ chủ đầu tư đưa; không bấm link "trang tập" gửi qua Zalo, email. Trên Desk tập: mã VietQR **không dùng để chuyển tiền**; không nhập số điện thoại thật.

1. Đăng nhập lần đầu, đổi mật khẩu tạm, đăng xuất.
2. Báo giá, sao chép gửi Zalo.
3. Giữ chỗ; gia hạn 1 lần.
4. CTV: **Báo đã chuyển cọc** kèm ảnh biên nhận giả. Sale nội bộ: nói được cách kiểm tiền về trước khi **Xác nhận đã nhận cọc**.
5. Nói được: chính sách hủy; vì sao không gửi ảnh QR cũ; việc phải làm khi mã hiện "Tài khoản nhận vừa đổi".
