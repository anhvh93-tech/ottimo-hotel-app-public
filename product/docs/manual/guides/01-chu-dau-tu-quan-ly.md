# Hướng dẫn Chủ đầu tư và Quản lý – OTTIMO Desk v1.0

- Dành cho: **chủ đầu tư (OWN)**, **quản lý (MGR)**, và người làm **kế toán/đối soát** cùng chủ đầu tư
- Thiết bị: **máy tính hoặc laptop riêng** của anh/chị, địa chỉ `desk.ottimo.vn`. Máy quầy chỉ dùng khi duyệt tại quầy, xong đăng xuất ngay.
- Áp dụng cho: **OTTIMO Desk v1.0** (bản `v1.0.0`), chạy thật từ **thứ Hai 02/11/2026**
- Lập: BA · 30/10/2026 · Bộ hướng dẫn theo bộ phận, bản 1.2 (tách từ Sổ tay sử dụng OTTIMO Desk v1.0, bản nội dung 1.5; sửa theo review DOM, SEC, UXD, QA ngày 30/10; thêm phòng Google Chat, xóa theo yêu cầu người gửi, phòng Báo động theo SEC, ESC-041, ESC-042)
- Tài liệu không chứa mật khẩu, mã 2 bước, mã khôi phục, số tài khoản, mã cửa hay số giấy tờ. Khi đào tạo, anh/chị cũng không ghi những thứ này lên bảng hay vào tài liệu phát tay.
- **Tài liệu nội bộ OTTIMO – không chuyển tiếp cho người ngoài OTTIMO, không gửi vào nhóm chat, không chụp, không đăng lên mạng. Nghỉ việc hoặc hết hợp tác: xóa tệp trên máy và báo chủ đầu tư.** Bộ hướng dẫn chỉ do chủ đầu tư gửi, và không bao giờ có ô đăng nhập hay hỏi mật khẩu; tệp "hướng dẫn" nhận từ người khác thì không mở, báo chủ đầu tư.

<!-- Nguồn: product/docs/manual/user-manual-v1.0.md bản 1.5 mục 0.2–0.9, chương 1, 2.4 (phần OWN), 2.14a bước 6, 4.3, 5.1–5.8; day-one-guide.md mục 6, 9, 10; decision-log 29/10 (1 tài khoản giữ 6 vai), 30/10 (ESC-040 A; ORC phân xử C1). Bản 1.2: mục 12.1–12.2, 17.1 theo rounds/round-03/outputs/SEC/esc041-gchat-full-details.md mục L2.2, L2.4 (★4, ★7), ESC-041, ESC-042 (B), decision-log 30/10; phòng Báo động theo ESC-029 A, product/infra/server/bin/ops-check.sh, rounds/round-03/outputs/OPS/inv-production-steps.md phần 6. -->

## Cách đọc tệp này

- Chữ **in đậm** là tên nút, tên màn hình, tên ô đúng như trên Desk. Ảnh màn hình có mã ở dưới ảnh (ví dụ C2-05). Khung nét đứt ghi **Chưa có ảnh** hoặc **Ảnh mới · chờ chụp** là ảnh đang chờ chụp: cứ làm theo chữ.
- Mục ghi **Chỉ chủ đầu tư** thì quản lý không thấy menu.
- Khung **Tạm ở v1.0** là việc Desk chưa làm được và cách làm thay. Mọi cách tạm tới bản v1.0.1 gom ở **mục 15**.
- Con số theo tham số ngày 27/10/2026. Anh/chị đổi được ở **Tham số quy tắc**. Khi số trên Desk khác số trong tệp: vừa đổi tham số thì làm theo Desk; không rõ vì sao, nhất là **số tiền**, thì coi là có thể lỗi ("P0" nếu sai tiền, mục 17).
- **Hiện OTTIMO có một người trực quầy giữ cả 6 vai** (quản lý, lễ tân trưởng, lễ tân, buồng phòng, bảo trì, sale). Chủ đầu tư đã chấp nhận người này tự ghi và tự duyệt giảm giá trong hạn mức quản lý; bù lại **chủ đầu tư rà Nhật ký tiền và Cần chú ý mỗi ngày** (mục 2). Riêng **hoàn tiền**, Desk không cho người tạo yêu cầu tự duyệt, tự chi, nên **chủ đầu tư duyệt và chi**. Người trực đọc tệp này ở phần "quản lý"; các tệp 02–05 cho phần việc còn lại.

---

## 1. Đăng nhập

### 1.1 Anh/chị đăng nhập ở đâu

| Việc | Địa chỉ | Thiết bị |
|---|---|---|
| Mọi việc quản lý, duyệt, đối soát, cài đặt | `desk.ottimo.vn` | **Máy riêng** (laptop/máy tính của anh/chị) |
| Duyệt tại quầy khi lễ tân cần ngay | `desk.ottimo.vn` | Máy quầy: đăng nhập, duyệt, **đăng xuất ngay** (mục 1.5) |
| Cấp quyền máy quầy (chỉ chủ đầu tư) | `desk.ottimo.vn` | Ngồi tại **chính máy cần cấp** (mục 1.10) |
| App nhân viên `staff.ottimo.vn` | – | **Chưa đăng nhập được** ở v1.0 (mục 1.8) |

- Chỉ vào bằng cách **gõ địa chỉ** hoặc **dấu trang**. Không bấm link đăng nhập gửi qua Zalo, email, tin nhắn – kể cả thư báo bảo mật.
- Trình duyệt hỏi **Lưu mật khẩu?**: luôn chọn **Không bao giờ**, nhất là trên máy quầy.
- Sau khi đăng nhập, Desk mở **Tổng quan**.

### 1.2 Lần đầu đăng nhập

Mật khẩu tạm: quản lý nhận **tận tay** từ chủ đầu tư. Không gửi qua chat.

1. Trên máy riêng, mở Chrome hoặc Safari, gõ `desk.ottimo.vn`.
2. Nhập **Tên đăng nhập** và **Mật khẩu** (mật khẩu tạm). Bấm **Đăng nhập**.
3. Desk mở **Đặt mật khẩu của bạn**. Nhập **Mật khẩu hiện tại** (mật khẩu tạm), **Mật khẩu mới**, **Nhập lại mật khẩu mới**.
4. Bấm **Lưu và vào ứng dụng**.
5. Desk mở ngay **Bật xác thực 2 bước** (bắt buộc với chủ đầu tư và quản lý). Làm tiếp mục 1.3.

[ẢNH: C0-01-Đăng nhập Desk]
[ẢNH: C0-02-Đặt mật khẩu lần đầu]

Quy tắc mật khẩu: ít nhất 10 ký tự, không chứa tên hoặc số điện thoại của mình, không phải mật khẩu phổ biến.

**Chủ đầu tư:** lưu mật khẩu Desk mới trong **trình quản lý mật khẩu** ngay khi đặt (không lưu trên trình duyệt). Ở v1.0 chưa có cách khôi phục khi chủ đầu tư quên mật khẩu (mục 1.7).

> **Trước ngày chạy 02/11:** trên Desk thật chỉ **đăng nhập, đổi mật khẩu tạm, bật 2 bước, đăng xuất**. Không tạo đơn, không thu tiền thử: dữ liệu tiền trên Desk thật chỉ ghi thêm, không xóa được. Tập thao tác trên **Desk tập** (mục 18.2). Lượt kiểm VietQR trước ngày D **đã làm 30/10** (mục 13): **không tạo thêm đơn thử**.

### 1.3 Bật đăng nhập 2 bước (bắt buộc)

Bước thứ hai là **mã 6 số trong ứng dụng xác thực** trên điện thoại (Google Authenticator, Microsoft Authenticator hoặc tương tự), kèm **10 mã khôi phục** dùng khi mất điện thoại. Desk v1.0 chưa đăng nhập bằng Face ID/vân tay.

**Làm trên máy hoặc điện thoại riêng của anh/chị, không làm trên máy quầy.**
1. Cài ứng dụng xác thực trên điện thoại. Bấm **Tôi đã cài – Tiếp tục**.
2. Nhập mật khẩu đăng nhập. Bấm **Tạo mã QR**.
3. Trong ứng dụng xác thực: **Thêm tài khoản → Quét mã QR**, quét mã trên màn hình.
4. Nhập mã 6 số ứng dụng đang hiện. Bấm **Xác nhận**.
5. Desk hiện **10 mã khôi phục** một lần duy nhất. Bấm **In** (lấy giấy ngay khỏi máy in) hoặc **Tải về (.txt)** rồi chép vào trình quản lý mật khẩu, **xóa tệp và dọn thùng rác**. **Không in, không tải trên máy quầy.** Cất 2 nơi tách khỏi điện thoại. Không chụp ảnh, không gửi qua chat.
6. Tích ô **Tôi đã cất 10 mã này ở nơi an toàn, tách khỏi điện thoại**. Nút **Hoàn tất (tích ô "đã lưu" trước)** đổi thành **Hoàn tất**. Bấm **Hoàn tất**.

[ẢNH: C0-03-Bật xác thực 2 bước, mã QR]
[ẢNH: C0-04-Mười mã khôi phục]

### 1.4 Đăng nhập hằng ngày

1. Gõ `desk.ottimo.vn`. Nhập tên đăng nhập, mật khẩu, bấm **Đăng nhập**.
2. Màn **Nhập mã xác thực**: mở ứng dụng, nhập mã 6 số đang hiện. Bấm **Xác nhận**.
3. Desk mở **Tổng quan**.

[ẢNH: C0-05-Nhập mã xác thực]

- Mã báo sai: "Mã chưa đúng hoặc đã đổi. Nhập mã đang hiện trong ứng dụng." Chờ mã mới, nhập lại.
- Gõ sai nhiều lần: "Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại." **Chủ đầu tư: gõ sai mật khẩu 2 lần thì dừng**, mở trình quản lý mật khẩu xem lại (mục 1.7).
- "Phiên đăng nhập đã hết": đăng nhập lại; thông tin đang nhập vẫn được giữ trên máy đó.

**Thao tác nhạy cảm** (thêm người dùng, đổi tài khoản nhận tiền, cấp quyền máy, khóa tài khoản…): Desk mở hộp **Xác nhận bằng mật khẩu và mã xác thực**. Mỗi mã chỉ dùng một lần; vừa dùng thì chờ ứng dụng hiện mã mới.

**Sắp hết mã khôi phục:** Desk nhắc "Sắp hết mã khôi phục". Trên máy riêng: **tên của mình → Xác thực 2 bước → Tạo bộ mã mới**. Bộ cũ hết hiệu lực ngay. Cất bộ mới như mục 1.3 bước 5.

[ẢNH: G1-01-Xác thực 2 bước, Tạo bộ mã mới]

### 1.5 Duyệt tại quầy trên máy quầy

**Luôn duyệt bằng tài khoản của chính mình.** Desk từ chối mọi ô "mật khẩu của quản lý" trên phiên của lễ tân (vì quản lý có 2 bước).

Khi lễ tân cần duyệt ngay tại quầy:
1. Lễ tân **đăng xuất**.
2. Anh/chị đăng nhập tài khoản của mình trên máy quầy (mật khẩu + mã 6 số).
3. Mở **Cần duyệt**, duyệt (mục 4).
4. **Đăng xuất** ngay.

Hoặc duyệt trên laptop riêng. Không đọc mật khẩu qua điện thoại, không đưa mật khẩu cho lễ tân gõ hộ.

> **Tạm ở v1.0:** chưa có xác nhận từ xa trên điện thoại của quản lý (có ở v1.1).

### 1.6 Đăng xuất, menu tài khoản

1. Bấm **tên của mình** ở góc trên bên phải.
2. Bấm **Đăng xuất**.

Menu gồm: **Đổi mật khẩu** · **Xác thực 2 bước** · **Ngôn ngữ giao diện** · **Giao diện** (Theo máy / Sáng / Tối) · **Đăng xuất**.

[ẢNH: C0-06-Menu Tài khoản]

### 1.7 Quên mật khẩu, mất điện thoại

| Tình huống | Làm gì |
|---|---|
| Quản lý quên mật khẩu | **Báo chủ đầu tư.** Desk không có nút "quên mật khẩu". Chủ đầu tư **Đặt lại mật khẩu**, đưa mật khẩu tạm tận tay |
| Chủ đầu tư hoặc quản lý mất điện thoại, còn mã khôi phục | Ở màn nhập mã, bấm **Mất điện thoại? Dùng mã khôi phục**, nhập một mã, bấm **Đăng nhập bằng mã khôi phục**. Desk mở **Đăng ký lại trên điện thoại mới**: làm lại như mục 1.3, trên máy riêng. **Làm xong đăng ký lại ngay, không bỏ dở.** Quản lý: rồi **báo chủ đầu tư** để **Đặt lại mật khẩu** cho mình (Desk đăng xuất trên mọi máy, kể cả máy bị mất) |
| Quản lý (người trực) mất cả điện thoại lẫn mã khôi phục | Người đó **báo chủ đầu tư**, không xin mã của người khác. Chủ đầu tư, trên máy riêng: (1) **Khóa tài khoản** của người đó ngay; (2) **Thêm người dùng** mới cho chính người đó, **tên đăng nhập mới**, đúng các vai cũ (mục 1.9); (3) đưa mật khẩu tạm tận tay; người đó đăng nhập lần đầu trên laptop riêng và bật 2 bước trên điện thoại mới. Desk v1.0 chưa có nút đặt lại 2 bước cho người khác; **Đặt lại mật khẩu không gỡ 2 bước**. Tài khoản cũ để khóa, không xóa (giữ nhật ký) |
| Chủ đầu tư mất cả điện thoại lẫn mã khôi phục | Làm theo thủ tục khôi phục riêng đã diễn tập với đội kỹ thuật (không ghi trong tài liệu này) |
| Chủ đầu tư quên mật khẩu | Ở v1.0 **chưa có cách khôi phục**: không ai trong Desk đặt lại được mật khẩu cho chủ đầu tư, thủ tục khôi phục riêng cũng không đổi mật khẩu. Vì vậy: lưu mật khẩu Desk trong **trình quản lý mật khẩu** ngay khi đặt (không lưu trên trình duyệt). Gõ sai **2 lần** thì dừng, mở trình quản lý mật khẩu xem lại: gõ sai tiếp Desk sẽ khóa, và chỉ một chủ đầu tư khác mới mở được. Đã quên hẳn: gọi đội kỹ thuật, không tự thử tiếp. |
| Mất điện thoại hoặc máy tính bảng có **app khóa cửa** | Chủ đầu tư **ngay** đổi mật khẩu tài khoản app khóa và thu hồi quyền của máy đó |
| Nghi lộ mật khẩu | Đổi mật khẩu ngay (**tên của mình → Đổi mật khẩu**), tạo bộ mã khôi phục mới, báo chủ đầu tư |

[ẢNH: G1-02-Dùng mã khôi phục]
[ẢNH: G1-03-Đăng ký lại trên điện thoại mới]

**Không ai** – chủ đầu tư, quản lý, đội kỹ thuật, ngân hàng hay OTA – hỏi mật khẩu, mã 6 số hay mã khôi phục của anh/chị. Ai hỏi thì không đưa và báo chủ đầu tư.

Không ai trong Desk đặt lại được mật khẩu hay 2 bước cho chủ đầu tư. Ai nhắn hay gọi nói "đặt lại giúp" rồi xin mật khẩu, mã 6 số hay mã khôi phục là lừa đảo, kể cả khi xưng đội kỹ thuật.

### 1.8 App nhân viên

Chủ đầu tư và quản lý (có 2 bước) **chưa đăng nhập được app nhân viên** `staff.ottimo.vn` ở v1.0. App báo "Đăng nhập 2 bước sẽ có ở bản sau" (cùng lúc hiện câu "Nhập mã…" nhưng không có ô nhập mã – lỗi chữ, đang sửa).

Hệ quả cho OTTIMO hiện nay: tài khoản người trực giữ vai quản lý nên **không vào được app nhân viên**. Việc dọn đánh dấu trên Desk (**Vận hành → Buồng phòng → Làm xong**), phiếu sửa làm trên Desk (**Vận hành → Bảo trì**). **Không ai bấm kiểm phòng được** (`VC` → `VI`). Người trực tự đi kiểm căn theo 12 mục rồi mới bấm **Làm xong** (`02` mục 13.2a). Lễ tân nhận khách vào căn `VC` như thường.

### 1.9 Cấp đăng nhập cho nhân viên (chỉ chủ đầu tư)

**Các vai trên Desk:**

| Vai | Dành cho | Đăng nhập 2 bước | Đăng nhập ở |
|---|---|---|---|
| **Chủ đầu tư** | Chủ đầu tư | Bắt buộc | Desk |
| **Quản lý** | Quản lý | Bắt buộc | Desk |
| **Lễ tân trưởng** | Thêm quyền duyệt trong hạn mức, nhận phòng ngoại lệ, kiểm phòng | Chưa | Desk + app nhân viên |
| **Lễ tân** | Lễ tân, người trực đêm | Chưa | Desk |
| **Buồng phòng** | Nhân viên buồng phòng | Chưa | App nhân viên |
| **Bảo trì** | Kỹ thuật | Chưa | App nhân viên |
| **Sale nội bộ** | Nhân viên bán hàng của OTTIMO | Chưa | Desk (điện thoại hoặc máy tính) |
| **CTV / môi giới** | Cộng tác viên ngoài | Chưa | Desk (điện thoại hoặc máy tính) |

Một người có thể có nhiều vai. Không có vai "Kế toán" riêng (mục 11). Khi có nhân viên thật: **mỗi người một tài khoản, đúng vai của mình**. Tới v1.0.1, tài khoản chỉ có vai Bảo trì vào Desk chỉ xem được phiếu, chưa tạo phiếu, chưa khóa phòng được: lễ tân hoặc người trực làm (mục 15.6).

**Thêm người dùng:**
1. **Quản trị → Người dùng & vai → Thêm người dùng**.
2. Nhập **Tên hiển thị**, **Tên đăng nhập** (chữ thường không dấu, ví dụ `lan.hk`).
3. **Mật khẩu tạm** do Desk tạo sẵn (bấm **Tạo mật khẩu khác** nếu muốn).
4. Chọn một hoặc nhiều vai. Bấm **Tạo tài khoản**.
5. Xác nhận bằng mật khẩu và mã 6 số.
6. Desk hiện **Mật khẩu tạm của …** **một lần**. Đưa tận tay người dùng. Không gửi qua chat.
7. Ngồi cùng người đó lần đăng nhập đầu: đổi mật khẩu tạm. Người có vai quản lý: làm trên laptop riêng (không phải máy quầy), bật 2 bước trên điện thoại riêng của họ, cất mã khôi phục như mục 1.3 bước 5.

[ẢNH: C1-07-Người dùng và vai]
[ẢNH: C1-08-Thêm người dùng]
[ẢNH: C1-09-Mật khẩu tạm hiện một lần]

Nhân viên buồng phòng, bảo trì (và lễ tân trưởng dùng app): lần đầu, và sau mỗi lần **Đặt lại mật khẩu**, đổi mật khẩu tạm trên `desk.ottimo.vn` trước, rồi mới đăng nhập app nhân viên (tệp 03, 04 mục 1). App chưa có màn đổi mật khẩu tạm: còn mật khẩu tạm mà vào app thì mọi màn báo "Chưa tải được … Có thể do mạng yếu" (mục 15.6).

**Các việc khác** (cột **Thao tác** ở dòng người dùng):
- **Sửa vai** → chọn vai → **Lưu vai**. Người đó bị đăng xuất ngay trên mọi máy.
- **Đặt lại mật khẩu**: dùng khi nhân viên quên mật khẩu, nghi lộ mật khẩu, mất điện thoại. Desk hỏi **Mật khẩu đăng nhập** và **Mã trong ứng dụng xác thực (6 số)**. Người đó bị đăng xuất trên mọi máy và phải đổi mật khẩu tạm ở lần đăng nhập tới. **Đặt lại mật khẩu không gỡ khóa và không gỡ 2 bước**: tài khoản đang bị khóa thì bấm **Mở khóa**; quản lý mất cả điện thoại lẫn mã khôi phục thì làm theo mục 1.7.
- **Khóa tài khoản**: dùng khi nghỉ việc, hết hợp tác CTV, hoặc mất điện thoại. Desk hỏi **Mật khẩu đăng nhập** và **Mã trong ứng dụng xác thực (6 số)**. **Mở khóa** khi cần dùng lại.
- Trạng thái **Tạm khóa do sai mật khẩu**: chờ hết thời gian khóa, hoặc bấm **Mở khóa**. Người đó nói không gõ sai: hỏi lại, rồi đổi mật khẩu cho họ (**Đặt lại mật khẩu**) và xem **Cần chú ý**.
- Trạng thái **Chờ đổi mật khẩu tạm**: người đó chưa đăng nhập lần đầu.

[ẢNH: G1-04-Hộp Khóa tài khoản]
[ẢNH: G1-05-Hộp Đặt lại mật khẩu]

### 1.10 Cấp quyền máy quầy (chỉ chủ đầu tư)

Máy quầy phải được cấp quyền thì lễ tân mới nhận phòng, xem giấy tờ, nhập nơi nhận hoàn được.

1. Ngồi tại **chính máy cần cấp**. Đăng nhập Desk bằng tài khoản chủ đầu tư.
2. **Quản trị → Thiết bị được cấp**. Form cấp quyền chỉ hiện trên máy **chưa** được cấp; máy đã cấp chỉ thấy "Máy này đã được cấp quyền." và bảng thiết bị.
3. Nhập **Tên máy** (ví dụ "Máy quầy 1"), chọn **Loại thiết bị**: **Máy quầy / laptop** hoặc **Máy tính bảng của cơ sở**.
4. Tích đủ 5 mục **Kiểm máy trước khi cấp**: **Ổ đĩa đã mã hóa** · **Tự khóa màn hình sau 5 phút** · **Trình duyệt không cài tiện ích** · **Tắt lịch sử/đồng bộ bộ nhớ tạm** · **Đội kỹ thuật đã kiểm máy này**. Nút ghi **Cấp quyền thiết bị này (còn … mục kiểm)** tới khi tích đủ.
5. Nhập **Nhập lại mật khẩu đăng nhập để cấp quyền** và **Mã trong ứng dụng xác thực (6 số)**. Bấm **Cấp quyền thiết bị này**.
6. **Đăng xuất.** Lễ tân đăng nhập trên máy này sẽ thấy **Máy quầy đã cấp quyền**.

[ẢNH: C1-10-Thiết bị được cấp]
[ẢNH: C0-08-Chip máy quầy đã cấp quyền]

- Quyền có hạn (máy quầy dài hơn, máy tính bảng ngắn hơn). Hết hạn thì cấp lại.
- Máy hỏng, mất hoặc bán: bấm **Thu hồi** ở dòng máy. Máy đó không xem được giấy tờ ngay.
- Không bao giờ cấp quyền cho điện thoại cá nhân.
- Máy quầy đã cấp quyền không cài, không mở Zalo hay ứng dụng chat.

---

## 2. Việc mỗi ngày

### 2.1 Danh sách việc

| Khi nào | Việc | Ở đâu |
|---|---|---|
| **Mỗi sáng trước 09:00, kể cả ngày nghỉ** (chủ đầu tư) | Kiểm bảo mật buổi sáng (mục 2.2) | **Tham số quy tắc**, **Tổng quan**, **Nhật ký tiền**, app ngân hàng |
| Sáng | Xem **Cần chú ý** và **Cần duyệt** | **Tổng quan** (mục 3) |
| Sáng, cùng lượt kiểm bảo mật (tới v1.0.1) | Xem lại các dòng có chữ "giữ chỗ" trong sổ giao ca và các yêu cầu hoàn mới; **duyệt và chi các khoản hoàn người trực tạo** (mục 15.2). Khoản đã hẹn khách: hoàn muộn nhất 24 giờ sau khi khách nhận phòng; Desk báo khoản thu chưa đối soát thì đối soát cọc cũ ở **Chờ đối soát** trước. Xem lại các khoản miễn/giảm người trực làm bằng quyền quản lý | Sổ giao ca, **Cần duyệt**, **Nhật ký tiền → Hoàn tiền** |
| Trước 09:00 | Đối soát khoản chuyển khoản lễ tân ghi ban đêm | **Nhật ký tiền → Chờ đối soát** (mục 8.2) |
| 07:00–22:00 | Trả lời lễ tân hỏi tiền chuyển khoản đã về chưa, **đúng mã đơn và số tiền** | Điện thoại (mục 8.5) |
| Trong ngày | Duyệt yêu cầu miễn/giảm, hoàn tiền, xóa công nợ | **Cần duyệt** (mục 4) |
| Trong 24 giờ sau mỗi lần trả muộn quá 18:00 | Xem lại phụ thu bằng giá 1 đêm | **Tổng quan → Cần chú ý** (mục 5) |
| Trong 24 giờ sau khi khách rời sớm | Giảm tiền phòng các đêm chưa ở | Folio (mục 7.3) |
| Mỗi ngày | Đối chiếu chuyển khoản với sao kê | **Nhật ký tiền → Chờ đối soát** |
| Cuối ngày (3 ngày đầu: 22:00 cùng lễ tân, qua điện thoại được) | Đối chiếu tiền trong ngày với sổ giấy và két; nhận tiền vượt quỹ lẻ, ký sổ | **Nhật ký tiền** (mục 11) |
| Trong 24 giờ sau mỗi lần xóa yêu cầu website theo yêu cầu người gửi (từ v1.0.1; quản lý, dự phòng chủ đầu tư) | Xóa luồng tin của mã đó trong Google Chat, ghi sổ xóa Chat | Google Chat (mục 12.2) |
| Mỗi tháng (từ v1.0.1; chủ đầu tư) | Rà thành viên phòng "OTTIMO – Yêu cầu đặt phòng"; đối chiếu sổ xóa Chat | Google Chat, **Yêu cầu từ website** (mục 12.1, 12.2) |
| Khi nhận tin **FAIL** ở phòng "OTTIMO – Báo động" (chủ đầu tư) | Mở thử Desk, báo đội | Mục 17.1 |

### 2.2 Kiểm bảo mật mỗi sáng

> **Tạm ở v1.0** (tới khi thư "Security notice" về tới chủ đầu tư; lỗi đang sửa ở bản vá, chậm nhất 09/11): ở v1.0 thư báo đổi tài khoản nhận tiền, dùng mã khôi phục, đặt lại 2 bước **chưa gửi tới ai**. Vì vậy mỗi sáng trước 09:00:
> 1. **Chủ đầu tư** mở **Tham số quy tắc → Tài khoản nhận chuyển khoản (VietQR)**: đúng **một** dòng **Đang dùng**, tên chủ tài khoản đúng, **không** có dòng **Đã lên lịch** lạ. Có dòng lạ: **Hủy lịch** ngay và làm theo mục 10.2.
> 2. **Chủ đầu tư** xem **Tổng quan → Cần chú ý** và **Nhật ký tiền** từ hôm qua tới hôm nay: có dòng **Đổi tài khoản nhận chuyển khoản** mà mình không làm, hay dấu hiệu ai đó dùng mã khôi phục/đặt lại 2 bước của mình, thì **gọi đội ngay**. Không đổi lại tài khoản trên chính phiên đó.
> 3. **Chủ đầu tư hoặc quản lý** đối soát tiền chuyển khoản trên app ngân hàng với các khoản VietQR trên Desk của ngày hôm trước (mục 8.2). Khoản Desk ghi nhận mà ngân hàng không có: báo chủ đầu tư ngay.
> 4. **Chủ đầu tư** ghi một dòng vào sổ giao ca: "Đã kiểm TK nhận + nhật ký – <giờ>". Không ghi số tài khoản.

[ẢNH: C1-11-Tài khoản nhận đang dùng]

---

## 3. Màn Tổng quan

1. Đăng nhập. Desk mở **Tổng quan** (đêm nay).
2. Hàng số liệu: **Công suất đêm nay**, **Khách đến / đi**, **Đang ở**. Giữ chỗ chưa cọc và đơn OTA chưa gán căn không tính vào công suất.
3. **Cần duyệt (n)**: yêu cầu đang chờ anh/chị.
4. **Cần chú ý (n)**: việc cần xử lý (khai báo sắp hạn, công nợ, phiếu sửa quá hạn, phụ thu chờ xem lại…). Dòng **Chỉ chủ đầu tư thấy** là cảnh báo miễn phí vượt ngưỡng.
5. Mỗi dòng có nút **Mở** hoặc nút xử lý ngay (**Thu công nợ**, **Xóa công nợ**, **Đã xem**, **Đã xử lý**). Dòng khẩn phải ghi **Ghi chú xử lý**.
6. Màn tự tải lại khoảng 30 giây một lần.

[ẢNH: C1-01-Tổng quan]

Menu của chủ đầu tư và quản lý: **Tổng quan**, **Cần duyệt**, mọi mục **Vận hành** và **Khách & bán**, **Nhật ký tiền**, **Minibar** (sửa), **Danh mục căn** (sửa), **Tham số quy tắc** (sửa). Chỉ chủ đầu tư: **Người dùng & vai**, **Thiết bị được cấp**.

---

## 4. Duyệt yêu cầu (Cần duyệt)

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
3. Bấm **Duyệt** → nhập **Mật khẩu đăng nhập** (Desk không hỏi mã 6 số ở bước này) → xác nhận.
4. Hoặc **Từ chối** → ghi **Lý do từ chối** + **Mật khẩu đăng nhập**.
5. Yêu cầu bị sửa sau khi anh/chị mở: Desk báo, bấm **Tải lại** rồi quyết định.

[ẢNH: C1-13-Cần duyệt]
[ẢNH: C1-14-Hộp duyệt]

**Quy tắc tách nhiệm (Desk tự kiểm):**
- Không ai tự duyệt yêu cầu của chính mình, trừ khoản nằm trong hạn mức tự áp của vai.
- **Hoàn tiền – không tự duyệt, không ngoại lệ:** người tạo yêu cầu hoàn (hủy đơn, sửa dòng…) không duyệt được khoản đó, kể cả quản lý, chủ đầu tư. Desk từ chối, yêu cầu vẫn chờ người duyệt khác. Người tạo yêu cầu cũng không chi khoản đó. Riêng chủ đầu tư được chi khoản **chuyển khoản** do mình tạo, sau khi người khác đã duyệt.
- Hoàn **tiền mặt**: người nhập nơi nhận không duyệt được khoản đó, kể cả chủ đầu tư. Vì vậy người tạo yêu cầu nhập nơi nhận trước, rồi người khác duyệt. Người duyệt được chi tiền mặt.
- Hoàn chuyển khoản: người chi ≠ người tạo yêu cầu ≠ người duyệt ≠ người nhập nơi nhận. **Riêng chủ đầu tư** được vừa duyệt vừa chi cùng một khoản, và được chi khoản do mình tạo sau khi người khác đã duyệt. **Quản lý không bao giờ** vừa duyệt vừa chi cùng một khoản.
- Tổng miễn trên một lượt ở vượt ngưỡng: Desk báo chủ đầu tư (không chặn).

---

## 5. Phụ thu trả muộn bằng giá 1 đêm – xem lại sau trả phòng

Khi khách rời **sau 18:00** mà đêm đó căn **đã có khách khác đến**, lễ tân không bán thêm đêm được. Lễ tân gọi anh/chị báo trước, rồi chọn **Ghi phụ thu – quản lý xem lại**: Desk ghi đúng giá 1 đêm của đêm đó, không sửa, không miễn tại quầy. Anh/chị xem lại **trong 24 giờ kể từ lúc lễ tân bấm trả phòng**.

1. Anh/chị nhận thông báo. Mở **Tổng quan → Cần chú ý**, dòng **Đơn …: phụ thu trả muộn bằng giá 1 đêm chờ xem lại** (có hạn xem).
2. Bấm **Mở folio** (folio: bảng tiền của lượt ở). Đọc lý do lễ tân ghi và số đã thu.
3. **Đồng ý**: bấm **Đã xem**. Xong.
4. **Nên giảm hoặc miễn**: trong folio, ở dòng phụ thu bấm **Điều chỉnh** → nhập số mới (hoặc **Bỏ cả dòng**) → **Lý do điều chỉnh** → **Ghi điều chỉnh**. Desk **tự tạo yêu cầu hoàn** phần chênh.
5. Yêu cầu hoàn đi vào **Cần duyệt**. **Người sửa dòng không tự duyệt khoản hoàn**: quản lý sửa thì chủ đầu tư duyệt; chủ đầu tư sửa thì **quản lý** duyệt.
6. Sau khi duyệt, chi hoàn ở **Nhật ký tiền → Hoàn tiền** (mục 8.3).
7. Quá 24 giờ chưa xem: Desk báo chủ đầu tư, bill đóng, không sửa được nữa.

[ẢNH: C1-15-Cần chú ý, phụ thu chờ xem lại]
[ẢNH: C1-16-Folio, điều chỉnh dòng]

Ví dụ: căn 203 đêm thường giá 792.000 đ. Khách rời 20:30, đêm đó căn đã có khách đến. Desk ghi phụ thu 792.000 đ. Quản lý xét giảm 50 %: sửa dòng còn 396.000 đ, Desk tạo yêu cầu hoàn 396.000 đ, chủ đầu tư duyệt, lễ tân hoặc quản lý chi.

---

## 6. Công nợ

- **Ghi công nợ** (khách đi khi chưa trả đủ) **chỉ quản lý hoặc chủ đầu tư** làm, trên phiên của chính mình, ở bước **Bill & thu tiền** khi trả phòng:
  1. Lễ tân dừng ở bước 3, đăng xuất. Quản lý đăng nhập (hoặc làm trên máy riêng), mở **Trả phòng** của đơn đó.
  2. Thu phần khách trả được (nếu có).
  3. Bật **Ghi công nợ – khách trả sau**. Chọn **Hạn thanh toán** (từ ngày mai; mặc định 3 ngày), ghi **Lý do ghi công nợ**.
  4. Bấm **Ghi công nợ … – hoàn tất**.
- **Thu công nợ** (lễ tân làm được): khung đơn hoặc **Cần chú ý** → **Thu công nợ** → chọn **Cách thanh toán**, nhập **Tiền** → **Ghi nhận đã thu …**. Thu một phần được.
- **Xóa công nợ** (chỉ quản lý, chủ đầu tư): **Xóa công nợ** → chọn **Khoản xóa công nợ** → **Lý do xóa công nợ** → nhập lại mật khẩu → **Xóa công nợ …**. Quản lý xóa tới giá 1 đêm; vượt mức thì yêu cầu chuyển chủ đầu tư duyệt.
- Công nợ hiện ở **Cần chú ý** tới khi thu đủ hoặc xóa.

[ẢNH: C1-17-Xóa công nợ]
[ẢNH: G1-06-Bước Bill, bật Ghi công nợ khách trả sau]

---

## 7. Sửa sau khi đã trả phòng

### 7.1 Folio đã chốt

- **Folio** đã chốt khi trả phòng. Chỉ quản lý và chủ đầu tư ghi **Điều chỉnh** (bút toán: ghi thêm dòng sửa, không xóa dòng cũ), có lý do. Desk ghi một dòng đảo và một dòng mới.
- Ghi nhầm một khoản thu: trong folio, mục **Giao dịch thu** → **Đảo giao dịch** → **Lý do đảo**. Còn phải thu tăng lại đúng số đó.
- Khách còn dư tiền sau trả phòng: khung đơn hiện "Khách đã trả phòng và còn dư …". Bấm **Đề nghị hoàn …** để vào luồng hoàn.
- **Hoàn tác nhận phòng** (chỉ quản lý, trong ngày, khi folio chưa có dòng mới). Folio đã có dòng mới (ví dụ đã thu tiền): Desk từ chối dù nút vẫn hiện (lỗi đang sửa). Khi đó bỏ các dòng mới (**Folio & điều chỉnh** → **Điều chỉnh** → **Bỏ cả dòng**) và đảo khoản thu mới (**Giao dịch thu** → **Đảo giao dịch**) trước, rồi mới hoàn tác.

### 7.2 Phát sinh trong 24 giờ sau trả phòng

- **Trong 24 giờ sau khi hoàn tất trả phòng**: mở đơn **Đã trả phòng** → **Thêm phát sinh** → chọn **Khoản**, **Số lượng**, **Ghi chú** → **Thêm vào folio**. Lễ tân trở lên làm được.
  - Khoản phạt hoặc đền bù: ô **Ghi chú** đổi thành **Ảnh hoặc ghi chú bằng chứng** và **bắt buộc**. Đính ảnh bằng **Thêm ảnh từ buồng phòng**, hoặc ghi rõ chỗ hỏng. Ảnh chụp bằng điện thoại của cơ sở (không chụp khách, giấy tờ); đính xong thì xóa ảnh khỏi điện thoại. Đơn chưa gửi nội quy thì hộp có cảnh báo: đọc trước khi thêm khoản phạt.
  - Khung đơn hiện **Còn phải thu** và nút **Thu công nợ**; liên hệ khách thu theo mục 6.
  - Ghi nhầm: quản lý mở **Folio & điều chỉnh** → chọn dòng → **Điều chỉnh** → **Bỏ cả dòng (ghi bút toán đảo, không xóa)**, hoặc sửa số lượng/đơn giá, ghi **Lý do điều chỉnh**. Lễ tân không điều chỉnh được folio đã chốt. Đơn còn công nợ thì Desk không cho giảm hay bỏ dòng: dùng **Xóa công nợ** (mục 6).
- **Quá 24 giờ:** Desk khóa folio. **Không ai** thêm hay điều chỉnh được, kể cả quản lý và chủ đầu tư. Desk báo "Phiếu thanh toán đã khóa sau khi trả phòng…" – bỏ qua vế "Chỉ quản lý ghi được bút toán điều chỉnh", vế này sai (lỗi đang sửa). Nút **Thêm phát sinh** và **Điều chỉnh** có thể còn hiện tới khoảng 1 giờ sau khi khóa; bấm thì Desk từ chối.
  - Khoản còn nợ: **Thu công nợ**, hoặc **Xóa công nợ**.
  - Phát hiện mới sau 24 giờ (hư hỏng, minibar): ghi sổ giao ca kèm mã đơn, báo chủ đầu tư. Không thu ngoài Desk.

### 7.3 Khách trả phòng sớm – giảm tiền các đêm chưa ở

> **Tạm ở v1.0** (nút trả phòng sớm có ở v1.0.1, dự kiến 04/11): lễ tân ghi giờ khách báo rời vào sổ giao ca, để căn **Đang ở** tới ngày đi, bấm **Trả phòng** đúng ngày đi trên đơn. Rồi **quản lý mở folio trong 24 giờ** và giảm tiền phòng các đêm chưa ở theo chính sách:
> - Đơn Trực tiếp/CTV báo trước từ 1 ngày: hoàn 50 % tiền các đêm chưa ở. Phụ thu người của các đêm đó hoàn 100 %.
> - Báo trong ngày rời: không hoàn.
> - Đơn OTA: theo kênh.
> - Cách giảm: ở dòng tiền phòng đêm chưa ở, **Điều chỉnh** giá đêm. Giá mới thấp hơn **sàn** thì Desk không lưu: khi đó dùng **Mở form miễn phí / giảm giá** trên dòng đó (giảm giá đặc biệt), số tiền = phần hoàn, lý do "Khách rời sớm".
> - Desk tự tạo yêu cầu hoàn. Người sửa dòng không tự duyệt khoản hoàn (mục 5 bước 5).
>
> Ví dụ: đơn căn 202 từ 9/11 đến 16/11, 5.205.000 đ. Ngày 12/11 khách báo sẽ rời 14/11, tức báo trước 2 ngày. Hai đêm bỏ là 14/11 (thứ Bảy) 820.000 đ và 15/11 713.000 đ, cộng 1.533.000 đ. Hoàn 50 % là 766.500 đ, **làm tròn lên 767.000 đ** (làm tròn có lợi cho khách). Các đêm đã ở **không** tính lại mức giảm 7 đêm.
>
> Cho kế toán: theo cách tạm này, đêm khách bỏ vẫn hiện là đêm bán trong **Nhật ký tiền** tới khi quản lý điều chỉnh. Phần giữ lại nằm trong tiền phòng, không tách thành dòng "phí trả phòng sớm".

---

## 8. Nhật ký tiền, đối soát và hoàn tiền

### 8.1 Ba tab của Nhật ký tiền

**Quản trị → Nhật ký tiền**:

| Tab | Dùng để |
|---|---|
| **Nhật ký thao tác tiền** | Xem mọi thao tác tiền: lúc nào, ai làm, thao tác gì, đơn nào, trước → sau, lý do. Lọc **Từ ngày** – **Đến ngày** (không lọc theo giờ, không lọc theo người). Lễ tân chỉ thấy khoản của mình |
| **Chờ đối soát** | Khớp từng khoản chuyển khoản, VietQR với sao kê ngân hàng |
| **Hoàn tiền** | Nhập nơi nhận hoàn, chi hoàn tiền mặt, ghi đã hoàn chuyển khoản |

[ẢNH: C1-18-Nhật ký thao tác tiền]

> **Lỗi nhỏ đã biết (sửa ở v1.0.2):** cột lý do có thể hiện **mã lý do thô** (chữ tiếng Anh nối bằng gạch dưới). Đọc phần lý do người làm tự ghi, bỏ qua mã.

### 8.2 Đối soát chuyển khoản (mỗi ngày)

1. Mở tab **Chờ đối soát**. Mở sao kê ngân hàng cùng lúc.
2. Với mỗi khoản: thấy tiền về thì bấm **Đã khớp sao kê** → xác nhận. Không thấy tiền thì bấm **Không thấy tiền**: folio trở lại còn phải thu, quản lý được báo.
3. Khoản quá 2 ngày chưa đối soát hiện **Quá … ngày**.
4. Không đối soát khoản do chính mình ghi (trừ chủ đầu tư).
5. Khoản chuyển khoản lễ tân ghi ban đêm: đối soát **trước 09:00** sáng hôm sau.

[ẢNH: C1-19-Chờ đối soát]

"Chờ đối soát" vẫn tính là đã thu: lễ tân nhận phòng, trả phòng bình thường.

### 8.3 Hoàn tiền

**Nhập nơi nhận hoàn** (thường người tạo yêu cầu đã nhập; chỉ lưu được trên máy quầy đã cấp quyền):
1. Tab **Hoàn tiền**, tìm dòng theo **mã đơn** OTM-… và giờ gửi.
2. Khoản chưa có nơi nhận: **Nhập nơi nhận hoàn** → chọn **Cách hoàn** (Desk chọn sẵn **Tiền mặt**; khách nhận lại theo cách đã trả thì bấm **Cùng cách khách đã trả**; hoặc **Chuyển khoản**) → **Lưu**. Dòng ghi "Cách hoàn: …" là xong, yêu cầu vẫn **Chờ duyệt**.
3. Người nhập nơi nhận **tiền mặt** không duyệt được khoản đó (mục 4).

**Hoàn chuyển khoản (sau khi đã duyệt):**
1. Chuyển tiền bằng ứng dụng ngân hàng của OTTIMO.
2. Khi ngân hàng báo thành công: **Ghi đã hoàn chuyển khoản / qua máy POS** → **Mã giao dịch ngân hàng / mã hoàn POS** → **Ảnh chứng từ** → xác nhận.

**Chi hoàn tiền mặt (sau khi đã duyệt):** **Chi hoàn tiền mặt** → **Ảnh chứng từ** (biên nhận có chữ ký khách) → xác nhận. Ghi sổ giao ca: giờ, số tiền, mã đơn, chữ ký.

[ẢNH: C1-20-Hoàn tiền]

### 8.4 Hoàn cọc cho khách giữ chỗ quá hạn (tới v1.0.1)

Người trực hủy giữ chỗ có cọc và nhập nơi nhận; **chủ đầu tư duyệt và chi**. Khi khách đến quầy mà chủ đầu tư vắng, người trực hẹn khách: "We will transfer your 300,000 VND deposit back to you within 24 hours." / "OTTIMO sẽ chuyển khoản lại 300.000 đ tiền cọc cho anh/chị trong vòng 24 giờ." (số tiền thay theo đơn).
1. Người trực nhắn anh/chị mã đơn và số tiền (không tên khách).
2. Anh/chị hoàn trong lượt kiểm sáng hôm sau, **muộn nhất 24 giờ sau khi khách nhận phòng**.
3. Desk báo khoản thu chưa đối soát: đối soát khoản cọc cũ ở **Nhật ký tiền → Chờ đối soát** trước, rồi mới chi.
4. Tiền mặt tại quầy chỉ khi anh/chị đang ở quầy hoặc đã hẹn một giờ cụ thể tới quầy.
5. Khách chuyển nốt cọc **sau** hạn (Desk không ghi được vào đơn cũ): đối chiếu sao kê sáng hôm sau; khoản đã chuyển sau hạn mà lễ tân không gộp được vào đơn mới thì anh/chị chuyển trả về đúng tài khoản đã chuyển trong 24 giờ.

### 8.5 Xác nhận tiền về cho lễ tân

> **Tạm ở v1.0** (đang chờ chủ đầu tư quyết cách lễ tân thấy tiền về tại quầy): 07:00–22:00 lễ tân gọi hoặc nhắn anh/chị **qua số đã lưu trong danh bạ điện thoại cơ sở**, kèm **mã đơn và số tiền**. Anh/chị kiểm app ngân hàng và trả lời **đúng mã đơn và số tiền**. Lễ tân chỉ bấm "đã nhận" khi có câu trả lời đó. 22:00–07:00 lễ tân mời khách trả tiền mặt/thẻ; khoản chuyển khoản tay ban đêm anh/chị đối soát trước 09:00.

---

## 9. Giá, tham số, minibar

### 9.1 Danh mục căn, giá đêm và giá tháng

Theo quyết định của chủ đầu tư ngày 26/10:
- **Giá đêm niêm yết** và **Giá tháng** nhập **riêng**, độc lập. Đổi giá này không đổi giá kia.
- Giá đêm là giá **đêm ngày thường, kênh Trực tiếp, cho định mức của căn, đã gồm VAT**, bội số 1.000 đ.
- Desk **tự cộng** đêm thứ Sáu, thứ Bảy **+15 %** và **ngày đặc biệt +30 %**. Anh/chị **không** nhập giá cuối tuần riêng.
- Ngày đặc biệt (+30 %, tối thiểu 2 đêm, không hoàn cọc khi hủy) đang cài: đêm 24/12/2026–01/01/2027 · Tết Nguyên đán đêm 05–10/02/2027 · Giỗ Tổ Hùng Vương đêm 16/4/2027 · đêm 30/4 và 1/5/2027 · đêm 1/9 và 2/9/2027. Danh sách đầy đủ ở **Tham số quy tắc**.
- Đơn ≥ 7 đêm Desk tự giảm 10 %, ≥ 14 đêm giảm 15 % (kênh Trực tiếp, CTV).

**Đổi giá một căn:**
1. **Quản trị → Danh mục căn**. Bảng có cột **Giá tháng**, **Giá đêm niêm yết**, **Bán**.
2. Bấm **Sửa** ở dòng căn.
3. Mục **Giá niêm yết**: nhập **Giá tháng** và/hoặc **Giá đêm niêm yết**.
4. Desk hiện ô **Hiệu lực từ** và **Lý do đổi giá**. Chọn **Hiệu lực từ** (hôm nay hoặc ngày sau). Gõ lại đúng giá đang dùng thì Desk báo "Đây là giá đang dùng…" và **Lưu** bị khóa.
5. Nhập **Lý do đổi giá**. Bấm **Lưu**.
6. Desk báo "Đã lưu căn …" hoặc "Đã lưu căn …. Giá áp dụng từ …".

[ẢNH: C1-02-Danh mục căn]
[ẢNH: C1-03-Sửa căn, giá đêm và giá tháng]

- Desk cảnh báo khi giá đêm thấp hơn giá tháng chia 30 ngày. Nếu đúng ý anh/chị, vẫn lưu được.
- Đơn, báo giá, hợp đồng tạo **trước** ngày hiệu lực **giữ giá cũ**.
- **Lỡ lên lịch nhầm một giá tương lai:** mở **Sửa**, chọn **đúng ngày hiệu lực** của giá nhầm, nhập giá đúng, **Lưu**. Giá đúng thay giá nhầm của ngày đó.

[ẢNH: C1-04-Sửa giá đã lên lịch]

> **Tạm ở v1.0:** Desk chưa hiện danh sách giá đã lên lịch và chưa có nút hủy (dự kiến v1.0.1). Mỗi lần lên lịch giá cho ngày sau, ghi **căn, giá, ngày hiệu lực** vào sổ. Muốn bỏ một giá đã lên lịch: nhập lại giá hiện hành với **đúng ngày hiệu lực** đó.

**Ngừng bán một căn** (ví dụ chủ đầu tư dùng riêng dài ngày): trong **Sửa**, tắt **Đang bán**. Căn không hiện trong form đặt phòng; sơ đồ phòng ghi **Ngừng bán**. Đơn đã có giữ nguyên. Hỏng hóc thì dùng **khóa phòng** (tệp 04), không dùng ngừng bán.

**Định mức và tối đa**: trong **Sửa**, mục **Số người**. **Tối đa** chỉ bằng định mức hoặc định mức + 1 (người thứ thêm ngủ sofa). Không tính trẻ dưới 6 tuổi.

### 9.2 Tham số quy tắc

1. **Quản trị → Tham số quy tắc**. Tham số chia nhóm: **Giữ chỗ, cọc, hủy** · **Số người & phụ thu** · **Giờ nhận/trả** · **FOC, hoa hồng, phí kênh** · **Bảo mật** · **Khác**.
2. Bấm **Sửa** ở tham số cần đổi.
3. Nhập **Giá trị mới**, chọn **Hiệu lực từ**, ghi **Lý do**. Bấm **Lưu thay đổi**.
4. Xem lại ai đổi gì ở **Lịch sử thay đổi** trong cùng hộp.

[ẢNH: C1-05-Tham số quy tắc]
[ẢNH: C1-06-Sửa tham số]

- Thay đổi áp cho đơn tạo **sau** ngày hiệu lực.
- Quản lý **không** sửa được hạn mức miễn phí (FOC), tỷ lệ hoa hồng, phí kênh và nhóm **Bảo mật**. Chỉ chủ đầu tư.
- Dòng ghi **Chờ chủ đầu tư xác nhận** hoặc **Chờ luật sư/kế toán xác nhận** là giá trị tạm, vẫn đang áp.
- **Form "Yêu cầu đặt phòng" trên website**: công tắc ở nhóm **Khác**, dòng `public_booking_requests_enabled` (chưa có tên tiếng Việt), giá trị `false` là tắt. Chỉ chủ đầu tư bật. Theo quyết định của chủ đầu tư ngày 26/10, **giữ tắt** tới khi luật sư trả lời.
- Đổi tham số làm số trên Desk khác số lễ tân đã học: báo người trực.

> **Lỗi đang sửa – Wi-Fi (sửa ở v1.0.1):** Desk chưa có chỗ nhập Wi-Fi của cơ sở, nên trang khách chưa hiện Wi-Fi (trang ghi "hỏi lễ tân"). Tới khi sửa xong: khách xem **thẻ Wi-Fi trong căn**; lễ tân đọc khi khách hỏi.

### 9.3 Danh mục minibar

**Quản trị → Minibar**. Chủ đầu tư, quản lý **Thêm mặt hàng** hoặc **Sửa**: **Tên tiếng Việt**, **Tên tiếng Anh**, đơn vị, **Mức chuẩn mỗi tủ**, **Giá bán**, **Giá vốn**, **Tồn tối thiểu**, công tắc **Miễn phí**. Giá mới áp cho lần kiểm minibar sau; dòng đã ghi folio giữ giá cũ. Lễ tân và buồng phòng chỉ xem, không thấy giá vốn.

[ẢNH: C1-21-Danh mục minibar]

---

## 10. Tài khoản nhận chuyển khoản – VietQR (chỉ chủ đầu tư)

Mọi mã VietQR khách quét đều chuyển tiền vào tài khoản này.

### 10.1 Đổi tài khoản nhận

1. **Quản trị → Tham số quy tắc**, kéo tới khối **Tài khoản nhận chuyển khoản (VietQR)**.
2. Bấm **Đổi tài khoản nhận**.
3. Nhập **Mã BIN ngân hàng (6 số)**, **Số tài khoản**, **Nhập lại số tài khoản**, **Tên chủ tài khoản** (chữ in hoa không dấu, như trên ngân hàng).
4. Chọn **Hiệu lực từ**. Sớm nhất là **ngày kinh doanh kế tiếp**. Không đổi ngay trong ngày được: đây là cách chống tráo tài khoản, không phải lỗi.
5. Ghi **Lý do đổi** (không ghi số tài khoản vào lý do). Bấm **Xem lại**.
6. Hộp **Kiểm tra trước khi lưu** hiện mã BIN, **Số tài khoản (che)**, tên chủ tài khoản, hiệu lực. Đối chiếu mã BIN, tên chủ tài khoản và 4 số cuối với ứng dụng ngân hàng. Sai thì **← Sửa lại**. Đúng thì bấm **Lưu tài khoản nhận**, xác nhận bằng mật khẩu và mã 6 số.
7. Desk báo đã lên lịch. Chủ đầu tư và quản lý thấy thông báo trong Desk.
8. **Báo trước cho lễ tân** mỗi lần đổi.

[ẢNH: C1-12-Đổi tài khoản nhận, bước xem lại]

- Sau khi lưu, Desk chỉ hiện **4 số cuối**. Muốn kiểm số đầy đủ: với **đơn thật đầu tiên** cần thu chuyển khoản sau lần đổi, trước khi gửi mã cho khách, tự quét mã bằng ứng dụng ngân hàng, **xem tên chủ tài khoản, không chuyển tiền**. **Không tạo đơn thử trên Desk thật** (ngoại lệ một lần trước ngày D: mục 13).
- Đổi ý trước ngày hiệu lực: bấm **Hủy lịch**.
- Trong 24 giờ sau khi tài khoản mới có hiệu lực, mã VietQR hiện cảnh báo "Tài khoản nhận vừa đổi trong 24 giờ qua…". Khi đó lễ tân **chưa cho khách chuyển**, **gọi điện cho anh/chị** xác nhận đã tự đổi tài khoản; anh/chị đồng ý mới tiếp tục.

> **Lỗi nhỏ đã biết (sửa ở v1.0.1):** câu gợi ý trên màn bảo "tạo một mã VietQR nhỏ và quét thử". Làm theo tệp này: **không tạo mã thử, không chuyển tiền**.

> **Lỗi đang sửa:** ở v1.0 thư báo đổi tài khoản nhận **chưa gửi tới email** của chủ đầu tư. Vì vậy chủ đầu tư kiểm mỗi sáng (mục 2.2).

### 10.2 Thấy dòng "Đã lên lịch" lạ, hoặc thông báo đổi tài khoản mà mình không làm

- **Chủ đầu tư**: mở Desk bằng cách **gõ địa chỉ** (không bấm link trong email hay tin nhắn), **Hủy lịch** ngay, **đổi mật khẩu**, **tạo bộ mã khôi phục mới**, báo đội.
- **Quản lý**: **gọi chủ đầu tư ngay** (quản lý không có nút Hủy lịch). Tới khi chủ đầu tư xác nhận, lễ tân **ngừng gửi mã VietQR**, mời khách trả tiền mặt hoặc thẻ.

---

## 11. Kế toán và đối soát

### 11.1 Kế toán dùng Desk thế nào ở v1.0

Ở v1.0 **không có vai "Kế toán" riêng** trên Desk. Việc kế toán do chủ đầu tư hoặc quản lý làm trên Desk; kế toán ngồi cùng hoặc nhận số liệu từ chủ đầu tư. Cách cấp quyền cho kế toán đang chờ chủ đầu tư quyết; đội đề xuất: tuần đầu kế toán chưa có tài khoản, từ v1.1 có vai **Kế toán** chỉ xem tiền và đối soát chuyển khoản (không xem giấy tờ khách, không duyệt, không sửa giá).

<!-- Chờ ESC-038. -->

### 11.2 Mốc chuyển sổ (ngày D = 02/11/2026)

- Doanh thu phòng **đêm trước D** theo sổ cũ; **từ đêm D** theo Desk. Không đêm nào nằm ở cả hai sổ.
- Cọc, tiền đã thu trước D được nhập vào Desk: Nhật ký tiền ghi **ngày nhập (D−1)**, ngày thu thật nằm ở ghi chú. Đây là **số chuyển sổ**, không phải tiền thu mới.
- Ký quỹ dài hạn và công nợ cũ (khách đã đi trước D) **ở lại sổ kế toán**, không nhập Desk.
- Chi tiết: hướng dẫn chuyển đổi ngày đầu (`day-one-guide.md`), mục "Kế toán" (chủ đầu tư giữ).

### 11.3 Đối chiếu thu chi hằng ngày

Chủ đầu tư/quản lý làm, kế toán cùng xem:
1. **Nhật ký tiền → Nhật ký thao tác tiền**, lọc **Từ ngày** – **Đến ngày** là hôm qua.
2. Cộng theo cách thanh toán: tiền mặt (so két và sổ giao ca), chuyển khoản/VietQR (so sao kê), thẻ POS (so phiếu tổng kết máy POS), **Đã thu qua OTA** (so báo cáo kênh).
3. Tab **Chờ đối soát**: khớp chuyển khoản với sao kê (mục 8.2).
4. Tab **Hoàn tiền**: kiểm khoản hoàn đã chi có chứng từ.
5. Dòng **Điều chỉnh**, **Đảo giao dịch**, **Miễn phí / giảm giá**, **Ghi công nợ**: đọc lý do; hỏi người làm nếu chưa rõ.

### 11.4 Sổ giấy 3 ngày đầu (02, 03, 04/11)

- Lễ tân ghi song song mọi đơn mới và mọi khoản thu vào sổ giấy.
- 22:00 mỗi tối: lễ tân ca tối so sổ giấy với Desk; chủ đầu tư nhận kết quả qua điện thoại. Lệch thì ghi lại, chủ đầu tư gõ `/feedback` **chỉ kèm mã đơn**, không ghi tên khách; sáng hôm sau lễ tân trưởng và chủ đầu tư xử lý. Không sửa tay lung tung.
- Sáng 05/11: chủ đầu tư quyết **bỏ sổ giấy** nếu 3 tối liền khớp. Sổ giấy hết dùng thì cất két cùng chứng từ kế toán.

### 11.5 Đóng ca, tiền mặt

> **Tạm ở v1.0 (tới v1.3):** chưa có màn đóng ca và bàn giao tiền mặt. Dùng **sổ giao ca** giấy:
> 1. Két có **quỹ lẻ cố định** để thối tiền, số tiền do chủ đầu tư đặt: ______ đ (ghi ở đầu sổ giao ca). Tiền vượt quỹ lẻ **nộp chủ đầu tư** (hoặc người chủ đầu tư giao) mỗi ngày; hai bên ký sổ.
> 2. Ai lấy tiền ra hoặc bỏ tiền vào két trong ca của người khác (quản lý chi hoàn, sale nộp tiền mặt, nộp tiền về chủ đầu tư) thì **ghi ngay một dòng vào sổ giao ca**: giờ, số tiền, mã đơn, chữ ký.
> 3. Cuối ca tính: **Tiền phải có = quỹ lẻ đầu ca + tiền mặt thu trong ca − tiền mặt chi trong ca − tiền nộp về**.
> 4. Đếm két. Ghi tiền phải có, tiền đếm, chênh lệch và lý do. Hai người giao và nhận cùng ký.
> 5. Chênh lệch khác 0: báo quản lý trong ca.
> 6. Ca đêm qua 00:00: lọc **Từ ngày** hôm trước **Đến ngày** hôm nay, chỉ cộng các dòng có giờ (cột **Lúc**) nằm trong ca.

### 11.6 Hóa đơn GTGT

> **Tạm ở v1.0:** xuất ngoài Desk như hiện nay (hóa đơn điện tử trên Desk có ở v1.3).
> - Mỗi ngày kế toán nhận từ sổ giao ca **danh sách mọi phiếu thanh toán đã cấp**: số phiếu, mã đơn, tổng tiền, cách thu, có/không lấy hóa đơn công ty.
> - Khách lấy hóa đơn công ty: chủ đầu tư/quản lý mở đơn → **Xem Phiếu thanh toán** để lấy tên công ty, mã số thuế, địa chỉ, email, số tiền.
> - **Ngày hóa đơn là ngày trả phòng.**
> - Hóa đơn cho khách lẻ không lấy hóa đơn, và hóa đơn cho đơn OTA đã trả trước: **kế toán xác nhận cách lập** (đang hỏi chủ đầu tư cùng câu về quyền của kế toán).
> - Giá niêm yết đã gồm VAT 8 %. Mức thuế từ 01/01/2027 chờ kế toán xác nhận.

### 11.7 Báo cáo ở v1.0

| Cần biết | Xem ở |
|---|---|
| Công suất, khách đến/đi đêm nay | **Tổng quan** |
| Tiền thu, hoàn, miễn, điều chỉnh theo ngày, theo người | **Nhật ký tiền → Nhật ký thao tác tiền**, lọc ngày |
| Khoản chuyển khoản chưa khớp | **Nhật ký tiền → Chờ đối soát** |
| Ai đổi tham số, giá | **Tham số quy tắc → Sửa → Lịch sử thay đổi** |

> **Tạm ở v1.0:** chưa có báo cáo tháng, báo cáo kênh, báo cáo FOC, xuất dữ liệu ra bảng tính (có ở v1.2). Cách làm thay:
> - Cuối tháng xem **Nhật ký tiền** lọc theo tháng cùng kế toán, ghi tổng theo cách thanh toán. Phí kênh OTA tạm theo tỷ lệ đã đặt (Airbnb 15,5 %, Booking 15 %, Agoda 18 %, Expedia 18 %, Trip.com 15 %).
> - Công suất từng đêm: ghi lúc **22:00** cùng lần đối chiếu (số căn **Đang ở** trên **Sơ đồ phòng**, không tính giữ chỗ, khóa phòng, đơn nội bộ), hoặc sáng hôm sau đếm cột đêm hôm qua trên **Sơ đồ phòng**. Không lấy ô **Công suất đêm nay** buổi sáng: buổi sáng ô này là đêm sắp tới.
> - Không chụp màn hình có tên khách gửi qua chat.

---

## 12. Dữ liệu khách và nhật ký

- Mọi thao tác tiền, miễn giảm, đổi giá, đổi tham số đều có người làm, giờ, lý do.
- Mỗi lần xem giấy tờ đầy đủ đều được ghi nhật ký truy cập. Chỉ lễ tân và quản lý xem số giấy tờ đầy đủ và ảnh; chỉ trên máy quầy đã cấp quyền; chỉ khi đang làm thủ tục hoặc khai báo cho đúng đơn đó.
- Khách xin xem, sửa, xóa dữ liệu của mình: lễ tân ghi lại và chuyển chủ đầu tư. Ở v1.0 chủ đầu tư xử lý bằng tay. Không hứa ngày. Khách xin xóa sớm ảnh: chỉ quản lý, chủ đầu tư làm (**Xóa ảnh**). Người gửi form website chưa thành đơn xin xóa: **Xóa theo yêu cầu người gửi** trên Desk, rồi xóa tin trong Google Chat (mục 12.2).

> **Tạm ở v1.0:** Desk chưa có màn xem nhật ký truy cập giấy tờ. Cần tra ai đã xem giấy tờ của một khách (ví dụ khách khiếu nại): chủ đầu tư nhắn Điều phối viên **chỉ mã đơn** và chữ "tra nhật ký giấy tờ". Kết quả gửi riêng cho chủ đầu tư, không lưu trong kho mã. **Không** gõ tên khách hay nội dung khiếu nại vào `/feedback`.

**Báo lỗi cho đội: mô tả bằng lời** – mã đơn, căn, giờ, đã bấm gì, Desk báo gì, mã tham chiếu Desk hiện. **Không** ghi tên, số điện thoại, email, số giấy tờ của khách. **Không chụp màn hình có dữ liệu khách để gửi đội.** Mọi thứ gõ qua `/feedback` đều được lưu vào kho mã của dự án, nên coi như người ngoài đọc được.

### 12.1 Phòng Google Chat "OTTIMO – Yêu cầu đặt phòng" (từ v1.0.1)

**Áp dụng từ bản v1.0.1** (dự kiến khoảng 04/11/2026). Từ bản này, mỗi yêu cầu mới trên website được Desk đăng vào phòng **"OTTIMO – Yêu cầu đặt phòng"** kèm **chi tiết khách**: tên, liên hệ, kênh, lời nhắn, ngày ở, số khách (anh/chị chọn mức đầy đủ, ESC-041). Tin trong phòng **không tự xóa** (anh/chị chấp nhận 30/10). Trước v1.0.1 chưa có tin Chat: người trực giữ Desk mở 07:00–22:00 (tệp 02 mục 13.1). Từ v1.0.1, Desk vẫn là nguồn chính.

Cách người trực dùng phòng và mẫu tin: tệp 02 mục 13.1a.

**Cài đặt phòng và tài khoản (chủ đầu tư làm trước khi v1.0.1 lên):**
- Phòng chỉ cho tài khoản **@ottimo.vn**; tắt cho người ngoài tổ chức tham gia.
- Thành viên chỉ gồm **chủ đầu tư, quản lý, lễ tân trưởng, lễ tân**. **Không mời** sale nội bộ, CTV, buồng phòng, bảo trì; không tài khoản dùng chung. Mời sale vào thì câu trong thông báo cho khách ("chỉ quản lý và lễ tân") thành sai.
- **Chủ đầu tư và quản lý là quản lý phòng** (space manager). Người trực hiện nay giữ vai quản lý: đặt làm quản lý phòng.
- Trong Admin console: bắt buộc **xác minh 2 bước** cho mọi tài khoản trong phòng; bật **quản lý thiết bị di động cơ bản**, để xóa tài khoản khỏi máy khi mất máy.
- Trong phòng không có ứng dụng hay webhook nào khác ngoài webhook của Desk. Không gửi, không dán đường dẫn webhook vào chat, email, tài liệu.
- Mỗi thành viên cài điện thoại theo bảng dưới **trước khi** được thêm. Anh/chị xem tận mắt.
- Người nghỉ việc: gỡ khỏi phòng **cùng lúc** **Khóa tài khoản** trên Desk (mục 1.9).
- **Mỗi tháng:** rà danh sách thành viên (đúng người, đúng vai, không ai lạ) và đối chiếu sổ xóa Chat (mục 12.2, bước 5).
- **Mỗi năm một lần:** xóa cả phòng, tạo phòng mới cùng cài đặt trên, cùng đội kỹ thuật (đội đổi đường gửi tin của Desk sang phòng mới).

**Cài đặt bắt buộc trên điện thoại của mọi thành viên, kể cả anh/chị:**

| Việc | iPhone | Android |
|---|---|---|
| Máy có khóa màn hình | **Cài đặt → Face ID/Touch ID & Mật mã** → bật mật mã | **Cài đặt → Bảo mật → Khóa màn hình**: mã PIN, mật khẩu hoặc hình vẽ. Không chọn "Vuốt" hay "Không" |
| Ẩn nội dung thông báo trên màn hình khóa | **Cài đặt → Thông báo → Chat → Hiển thị bản xem trước → Khi được mở khóa** | **Cài đặt → Thông báo → Thông báo trên màn hình khóa → Ẩn nội dung nhạy cảm** (tên mục khác nhau theo hãng: chọn mục không hiện chữ của tin) |
| Tắt email thông báo của Google Chat | Một lần cho tài khoản, trên máy tính: `chat.google.com` → bánh răng **Cài đặt** → **Thông báo qua email** → **Tắt** | Như iPhone |

Kiểm: nhắn thử vào phòng khi máy đang khóa; màn hình khóa không hiện chữ của tin. Lỡ nhận thư "tin chưa đọc" của Google Chat trong Gmail: xóa thư đó.

### 12.2 Xóa tin trong Google Chat khi người gửi form xin xóa (WR8, từ v1.0.1)

Trên Desk: **Yêu cầu từ website** → tìm mã hoặc **Tìm theo liên hệ** → mở yêu cầu → dưới khối **Liên hệ** → **Xóa theo yêu cầu người gửi** → chọn cách xác minh → **Xóa ngay**. Chủ đầu tư, quản lý, lễ tân trưởng làm được. Chi tiết: tệp 02 mục 13.1b. Phần trên Desk áp dụng ngay; phần Chat dưới đây áp dụng từ v1.0.1.

| Bước | Ai | Khi nào | Làm gì |
|---|---|---|---|
| 1 | Người xóa trên Desk | Khi xóa | **Chép mã yêu cầu `REQ-…`** trước khi bấm **Xóa ngay** |
| 2 | Người xóa trên Desk | Ngay sau bước 1 | Là chủ đầu tư hoặc quản lý: tự làm bước 3. Là lễ tân trưởng: nhắn quản lý (quản lý vắng thì chủ đầu tư) **chỉ mã yêu cầu** và chữ "xóa Chat theo WR8". Không chép tên, SĐT, lời nhắn |
| 3 | Quản lý phòng (quản lý; dự phòng chủ đầu tư) | **Trong 24 giờ** từ lúc xóa trên Desk | Trong phòng **"OTTIMO – Yêu cầu đặt phòng"**, tìm theo mã (gõ 8 ký tự sau "REQ-"). Xóa **mọi tin của luồng**: tin đầu (có chi tiết khách), các tin nhắc, tin "Đã xóa dữ liệu…", và **mọi tin nhân viên trả lời**. Tìm lại để chắc không còn |
| 4 | Quản lý phòng | Ngay sau bước 3 | Ghi **sổ xóa Chat** (trang riêng cuối sổ giao ca): mã yêu cầu · ngày xóa trên Desk · ngày xóa Chat · người làm · "đã xóa" hoặc "không còn trong Chat". **Chỉ mã, không tên, không SĐT.** Không nhắn gì trong phòng về việc xóa |
| 5 | Chủ đầu tư | Mỗi tháng, cùng lúc rà thành viên | Trên Desk, **Yêu cầu từ website** → chip **Đã đóng**: các yêu cầu đóng lý do "Đã xóa theo yêu cầu của người gửi" trong tháng. Mã nào chưa có dòng "đã xóa" trong sổ: làm ngay bước 3 |

- Cả quản lý và chủ đầu tư vắng, không ai xóa được trong 24 giờ: chủ đầu tư làm khi về, ghi lý do chậm vào sổ xóa Chat.
- Quản lý phòng không xóa được tin do Desk đăng (không có nút xóa): báo đội ngay bằng `/feedback`, **chỉ ghi mã yêu cầu**.
- Yêu cầu bị đánh dấu spam sau khi tin đã đăng: nên xóa luồng như bước 3 (không bắt buộc).

---

## 13. Việc riêng của chủ đầu tư trong tuần đầu

- **Kiểm VietQR trước ngày D: đã làm 30/10** (giữ chỗ thử OTM-00001, đã hủy, không chuyển tiền). **Không tạo thêm đơn thử.** Lần đổi tài khoản nhận sau: làm theo mục 10.1, kiểm ở đơn thật đầu tiên.
- Đổi giờ nhận phòng 12:00 trên Booking.com, Agoda, Airbnb, Google Maps, fanpage, thẻ trong căn trước 02/11. Câu chuẩn: "Check-in from 12:00 (your room is always ready by 14:00) · Check-out by 12:00" / "Nhận phòng từ 12:00 (phòng luôn sẵn sàng lúc 14:00) · Trả phòng trước 12:00". Không viết "phòng sẵn sàng từ 12:00".
- **Báo lễ tân trưởng danh sách kênh OTA đã đăng giờ nhận/trả và mức phụ thu trong nội quy.** Kênh chưa đăng thì lễ tân chưa thu phụ thu nhận sớm/trả muộn của khách đặt qua kênh đó.
- Ghi rõ ai được đóng/mở phòng trên extranet từng kênh.
- Đặt số **quỹ lẻ** trong két (mục 11.5).
- In **2 bản** tờ **Your ID details** khổ **A4** (bản in của UXD, `product/docs/print/pdf/to-4-your-id-details-a4.pdf`): một bản trong khung mica trên quầy, mặt quay ra khách; một bản dự phòng trong ngăn quầy. Làm **tối 01/11 sau buổi đào tạo, muộn nhất 06:00 ngày 02/11** (trước lần nhận giấy tờ đầu tiên trên Desk thật). In thử dưới đèn quầy trước khi đặt. Người trực báo tờ hỏng hay mất: in lại trong ngày. Nếu dùng máy tính bảng dự phòng: chuẩn bị máy theo tệp 02 mục 7.2 (không cấp quyền thiết bị, có mật mã, chỉ chép tệp `your-id-details-tablet.html`).
- Gửi bộ hướng dẫn: **riêng từng người**, đúng tệp của vai (`00` mục 5). Không gửi vào nhóm chat.
- Form "Yêu cầu đặt phòng" trên ottimo.vn (đã bật chiều 30/10): người trực giữ Desk mở trên máy quầy và điện thoại 07:00–22:00 (tệp 02 mục 13.1).
- Trước khi v1.0.1 lên (dự kiến khoảng 04/11): cài phòng Google Chat "OTTIMO – Yêu cầu đặt phòng" và tài khoản thành viên, xem tận mắt điện thoại từng người đã cài đặt (mục 12.1).
- Lưu số điện thoại của chủ đầu tư (và quản lý nếu có) vào danh bạ **điện thoại cơ sở**, để lễ tân gọi xác nhận tiền về và tài khoản nhận.
- Chuyển đổi dữ liệu ngày D theo hướng dẫn chuyển đổi ngày đầu (chủ đầu tư giữ).
- Yêu cầu của khách về dữ liệu cá nhân: xử lý bằng tay.
- Hóa đơn GTGT: vẫn xuất ngoài Desk (mục 11.6).

---

## 14. Tình huống thường gặp và không được làm

### 14.1 Tình huống thường gặp

| Tình huống | Làm gì |
|---|---|
| Lễ tân gọi: cần duyệt gấp, anh/chị ở xa | Duyệt trên laptop riêng ở **Cần duyệt**. Không đọc mật khẩu qua điện thoại |
| Lễ tân gọi hỏi tiền chuyển khoản đã về chưa | Kiểm app ngân hàng, trả lời đúng mã đơn và số tiền (mục 8.5) |
| Lễ tân gọi: mã VietQR hiện "Tài khoản nhận vừa đổi" | Xác nhận anh/chị có tự đổi không. Không đổi: làm theo mục 10.2 |
| Lễ tân gọi: khách ở quá 18:00, không còn căn trống | Nghe báo trước, không cần duyệt. Xem lại phụ thu trong 24 giờ (mục 5) |
| Khách đi khi chưa trả đủ | Ghi công nợ trên phiên của mình (mục 6) |
| Tôi đổi giá nhưng đơn cũ không đổi | Đúng. Đơn, báo giá tạo trước ngày hiệu lực giữ giá cũ |
| Đổi tài khoản nhận tiền không có hiệu lực ngay | Đúng: chống tráo tài khoản. Sớm nhất từ ngày kinh doanh kế tiếp |
| Đơn OTA về khi căn đã kín | Desk báo anh/chị; gán căn hoặc đổi phòng khách khác |
| Khách yêu cầu xem/xóa dữ liệu | Xử lý tay, không hứa ngày (mục 12) |
| Lễ tân lỡ gửi link check-in online | Ghi nhận mã đơn từ sổ giao ca; đội đối chiếu mỗi sáng (mục 15.3) |
| Nhân viên quên mật khẩu | **Đặt lại mật khẩu** (mục 1.9) |
| Nhân viên mất điện thoại | Không có 2 bước: **Đặt lại mật khẩu** hoặc **Khóa tài khoản**. Có 2 bước (quản lý) mà mất cả mã khôi phục: làm theo mục 1.7 |
| Nhân viên bị khóa do sai mật khẩu | **Mở khóa** (mục 1.9). Người đó nói không gõ sai: **Đặt lại mật khẩu**, xem **Cần chú ý** |

### 14.2 Không được làm

- Không bật 2 bước, không in hay tải mã khôi phục trên máy quầy.
- Không đọc mật khẩu qua điện thoại, không đưa mật khẩu cho lễ tân gõ hộ, không gõ mật khẩu của mình vào phiên của người khác.
- Không gửi mật khẩu tạm qua chat.
- Không cấp quyền máy cho điện thoại cá nhân.
- Không bấm link đăng nhập trong email, tin nhắn – kể cả thư báo bảo mật.
- Không tạo đơn thử, không chuyển tiền thử trên Desk thật (lượt kiểm VietQR C1 đã làm 30/10, không làm thêm – mục 13).
- Không cho nhân viên, CTV biết **tên đăng nhập của chủ đầu tư**; không ghi tên này vào sổ giao ca, nhóm chat, tài liệu phát tay.
- Không ghi số tài khoản vào lý do, sổ giao ca, `/feedback`.
- Không chụp màn hình có dữ liệu khách, không gõ tên khách vào `/feedback`.
- Không vừa duyệt vừa chi cùng một khoản hoàn chuyển khoản (quản lý).
- Không mời sale nội bộ, CTV, buồng phòng, bảo trì hay người ngoài vào phòng Google Chat "OTTIMO – Yêu cầu đặt phòng". Không chép chi tiết khách từ phòng sang nơi khác. Không ghi tên, SĐT khách vào sổ xóa Chat (mục 12.1, 12.2).
- Không thu tiền ngoài Desk.

---

## 15. Tạm thời tới v1.0.1

Các việc dưới đây làm theo cách tạm từ **02/11** tới khi anh/chị (chủ đầu tư) báo bản v1.0.1 đã lên (dự kiến 04/11; thư bảo mật chậm nhất 09/11).

### 15.1 Kiểm bảo mật mỗi sáng trước 09:00

Theo mục 2.2, kể cả ngày nghỉ. Hết tạm khi thư "Security notice" về tới chủ đầu tư.

### 15.2 Chủ đầu tư duyệt và chi mọi khoản hoàn người trực tạo

- Desk không cho người tạo yêu cầu hoàn tự duyệt, tự chi, kể cả có quyền quản lý. Người trực chỉ hủy và **nhập nơi nhận hoàn**.
- Anh/chị duyệt ở **Cần duyệt**, chi ở **Nhật ký tiền → Hoàn tiền** (mục 8.3, 8.4).
- Khoản đã hẹn khách: hoàn **muộn nhất 24 giờ** sau khi khách nhận phòng.

### 15.3 Rà giữ chỗ và lý do hủy

- Người trực rà giữ chỗ **3 mốc mỗi ngày** (mở quầy muộn nhất 09:00 · 11:00 · đóng quầy muộn nhất 21:00, gồm giữ chỗ hết hạn trước 09:00 sáng mai) vì Desk chưa báo giữ chỗ quá hạn vào **Cần chú ý**, và sau hạn Desk chỉ còn **Hủy giữ chỗ**. Chi tiết ở tệp 02 mục 17.1.
- Desk ghi sai với giữ chỗ có cọc quá hạn ("đơn đã tự hủy", "Không thu phí"): đơn chưa hủy; hủy thì Desk vẫn tạo yêu cầu hoàn đủ số đã nhận.
- Không dùng lý do hủy **Khác (ghi rõ)** (Desk khóa nút hủy). Chọn **Không liên lạc được** hoặc **Khách đổi ý**; lý do thật ghi sổ giao ca.
- Anh/chị xem lại các dòng có chữ "giữ chỗ" trong sổ giao ca cùng lượt kiểm sáng. Báo người trực khi v1.0.1 lên.

### 15.4 Check-in online tạm dừng

- Không tạo, không gửi link check-in online cho khách thật. Mọi khách làm giấy tờ tại quầy, được xem tờ **Your ID details** trước khi đưa giấy tờ.
- Đội kiểm mỗi sáng số link mới tạo trên Desk thật; khác 0 thì đội báo anh/chị mã đơn để đối chiếu với sổ giao ca.
- Anh/chị báo "mở lại check-in online" chỉ khi đội báo bản v1.0.1 đã có thông báo xử lý dữ liệu mới và bảo mật đã kiểm xong.

### 15.5 Khách trả phòng sớm

Quản lý giảm tiền phòng các đêm chưa ở trong 24 giờ theo mục 7.3.

### 15.6 Lỗi đang sửa liên quan tới anh/chị

| Lỗi | Cách tạm |
|---|---|
| Thư báo bảo mật chưa gửi tới chủ đầu tư | Kiểm bảo mật mỗi sáng (mục 2.2) |
| Chưa có danh sách và nút hủy giá đã lên lịch | Ghi sổ mỗi lần lên lịch giá (mục 9.1) |
| Chưa nhập được Wi-Fi trên Desk | Thẻ Wi-Fi trong căn |
| Câu gợi ý "tạo mã VietQR nhỏ và quét thử" | Không tạo mã thử (mục 10.1) |
| Folio đã khóa: câu báo ghi "Chỉ quản lý ghi được…" (sai) | Bỏ qua vế đó; không ai sửa được sau 24 giờ |
| **Hoàn tác nhận phòng** bị từ chối khi folio có dòng mới | Bỏ dòng mới và đảo khoản thu trước (mục 7.1) |
| Cột lý do trong Nhật ký tiền hiện mã thô | Đọc phần lý do người làm tự ghi |
| Chủ đầu tư/quản lý chưa đăng nhập được app nhân viên | Đánh dấu dọn và phiếu sửa trên Desk; người trực tự kiểm căn rồi mới bấm **Làm xong** (mục 1.8) |
| App nhân viên chưa có màn đổi mật khẩu tạm (BUG-R3-052) | Nhân viên mới, và sau mỗi lần **Đặt lại mật khẩu**: đổi mật khẩu tạm trên Desk trước rồi mới vào app (mục 1.9) |
| Tài khoản chỉ có vai Bảo trì không chọn được căn trên Desk: không tạo phiếu, không khóa phòng được (BUG-R3-053) | Lễ tân hoặc người trực tạo phiếu, khóa phòng trên Desk; bảo trì báo trên app hoặc nhắn ngày, căn, lý do |

---

## 16. Bảng giờ

| Giờ | Việc |
|---|---|
| **06:00** | Ngày mới trên Desk. Trước 06:00 vẫn là ngày hôm trước |
| 07:00 | Bắt đầu nhận câu hỏi "tiền về chưa" của lễ tân (tới 22:00). Form website đã bật: Desk mở trên máy quầy và điện thoại người trực tới 22:00 |
| **Trước 09:00** | Kiểm bảo mật buổi sáng; đối soát khoản chuyển khoản ghi ban đêm; duyệt và chi khoản hoàn người trực tạo |
| **09:00** | Người trực mở quầy muộn nhất, rà giữ chỗ mốc 1 |
| 11:00 | Người trực rà giữ chỗ mốc 2 |
| **12:00** | Giờ trả phòng; nhận phòng từ 12:00 |
| **14:00** | Mọi căn có khách đến hôm nay chắc chắn sẵn sàng. Mốc chuyển sổ ngày D |
| **18:00** | Sau 18:00 trả phòng: thêm 1 đêm, hoặc phụ thu bằng giá 1 đêm nếu căn đã bán (anh/chị nhận cuộc gọi báo trước) |
| **21:00** | Người trực đóng quầy muộn nhất, rà mốc 3 |
| 22:00 | Ba ngày đầu: nhận kết quả đối chiếu sổ giấy qua điện thoại; ghi công suất đêm |
| **23:00** | Người trực đánh dấu không đến; hạn khai báo khách Việt Nam |
| +24 giờ từ trả phòng | Hạn xem lại phụ thu bằng giá 1 đêm; hạn điều chỉnh folio, giảm tiền trả sớm; folio khóa |
| +24 giờ từ khi khách nhận phòng | Hạn hoàn cọc cũ đã hẹn khách |
| Thứ Tư 09:30–10:30 | Bản vá hằng tuần |
| 09/11 | Hạn bản sửa thư bảo mật; quá hạn đội bảo mật báo lại chủ đầu tư |
| +24 giờ từ khi xóa yêu cầu website trên Desk (từ v1.0.1) | Hạn quản lý phòng xóa luồng tin trong Google Chat (mục 12.2) |
| Mỗi tháng (từ v1.0.1) | Chủ đầu tư rà thành viên phòng Chat, đối chiếu sổ xóa Chat (mục 12.1) |

---

## 17. Khi có sự cố – ai gọi ai

| Sự cố | Ai báo | Anh/chị làm gì |
|---|---|---|
| Desk báo lỗi, không đặt / nhận / trả phòng / thu tiền được, hoặc **sai tiền** | Lễ tân trưởng → quản lý → chủ đầu tư | Chủ đầu tư gõ `/feedback` với chữ **"P0"** ở đầu, **chỉ ghi mã đơn**, không ghi tên khách – đội sửa trong ngày. Lễ tân ghi sổ giấy, nhập bù |
| Lỗi nhỏ, chữ sai, góp ý | Ai cũng được, qua chủ đầu tư | Chủ đầu tư gõ `/feedback <mô tả>`. Bản vá hằng tuần thứ Tư 09:30–10:30 |
| Mất điện quá 4 giờ | Quản lý → chủ đầu tư | Quyết đổi phòng hoặc bù (**Bù sự cố**) |
| Quên mật khẩu, mất điện thoại, tài khoản bị khóa (nhân viên) | Nhân viên → chủ đầu tư | **Đặt lại mật khẩu** / **Mở khóa** / **Khóa tài khoản** (mục 1.9). Quản lý mất cả điện thoại lẫn mã khôi phục: khóa tài khoản cũ, tạo tài khoản mới (mục 1.7) |
| Nghi lộ mật khẩu hoặc tài khoản lạ đăng nhập | Bất kỳ ai → chủ đầu tư ngay | **Đặt lại mật khẩu** người đó (Desk đăng xuất trên mọi máy) hoặc **Khóa tài khoản** |
| Dòng **Đã lên lịch** lạ ở tài khoản nhận, dấu hiệu ai dùng mã khôi phục của mình | Chủ đầu tư | Mục 10.2, gọi đội ngay |
| Mã VietQR hiện "Tài khoản nhận vừa đổi" mà chưa báo lễ tân | Lễ tân → chủ đầu tư | Xác nhận hoặc làm theo mục 10.2 |
| Mất điện thoại hoặc máy tính bảng có app khóa cửa | Bất kỳ ai → chủ đầu tư ngay | Đổi mật khẩu app khóa, thu hồi quyền máy đó |
| Khách khiếu nại về dữ liệu cá nhân | Lễ tân → chủ đầu tư | Xử lý tay; tra nhật ký theo mục 12 |

Khi báo lỗi cho đội: theo mục 12 – mô tả bằng lời, mã đơn, mã tham chiếu; không tên khách, không ảnh có dữ liệu khách.

### 17.1 Phòng Google Chat "OTTIMO – Báo động" (chỉ chủ đầu tư)

- Phòng cảnh báo kỹ thuật, **chỉ chủ đầu tư** ở trong phòng; không thêm người trực hay nhân viên. Tin không có dữ liệu khách.
- Nhận gì: tin **FAIL** khi máy chủ hoặc một dịch vụ có lỗi (ví dụ sao lưu, ổ đĩa, bộ nhớ, lỗi máy chủ), nhắc lại mỗi 6 giờ khi lỗi còn; tin **OK** khi đã hồi phục. Thêm **email** từ **Healthchecks.io** (máy chủ báo lỗi hoặc im lặng quá 1 giờ) và **UptimeRobot** (trang không mở được từ bên ngoài) về `info@ottimo.vn`.
- Nhận **FAIL**: mở thử `desk.ottimo.vn` bằng dấu trang. **Không vào được**: báo đội ngay bằng `/feedback` có chữ **"P0"**, ghi **giờ nhận tin** và tên mục trong tin; người trực ghi sổ giấy (tệp 02 mục 15). Vào được: người trực làm việc bình thường; anh/chị vẫn báo đội trong ngày kèm giờ nhận tin.
- **Không tự sửa máy chủ**, không đăng nhập máy chủ. Tin **OK** sau FAIL: không cần làm gì.

---

## 18. Bảng quyền và đào tạo

### 18.1 Bảng quyền theo vai (rút gọn)

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

Quy tắc tách nhiệm hoàn tiền (mục 4) áp lên trên bảng này: người tạo yêu cầu hoàn không tự duyệt, không tự chi. Tới v1.0.1, vai chỉ có Bảo trì chưa tạo phiếu, chưa khóa phòng được trên Desk (mục 15.6).

### 18.2 Tập ở đâu, bài tập (2 giờ; kế toán 1 giờ)

- Tập mọi thao tác trên **Desk tập** (dữ liệu giả) bằng **tài khoản tập** đội tạo sẵn. Địa chỉ và tài khoản tập: chủ đầu tư đưa tận tay trong buổi đào tạo. Mật khẩu Desk tập **khác** mật khẩu Desk thật. Tài khoản tập bị khóa sau buổi đào tạo cuối.
- Trên Desk tập: mã VietQR không dùng để chuyển tiền; không nhập giấy tờ, số điện thoại hay tài khoản thật.

Bài tập chủ đầu tư, quản lý:
1. Đăng nhập 2 bước, tạo bộ mã khôi phục mới (trên máy riêng). Chủ đầu tư: làm thử một lượt kiểm bảo mật buổi sáng (mục 2.2); nói được vì sao lưu mật khẩu Desk trong trình quản lý mật khẩu và dừng sau 2 lần gõ sai (mục 1.7).
2. Đổi giá đêm một căn có ngày hiệu lực.
3. Duyệt và từ chối một yêu cầu miễn phí ở **Cần duyệt**.
4. Xem lại một phụ thu trả muộn bằng giá 1 đêm: **Mở folio** → **Đã xem**.
5. Đối soát một khoản ở **Chờ đối soát**.
6. Chủ đầu tư: thêm một người dùng giả, **Đặt lại mật khẩu**, **Mở khóa** tài khoản bị khóa tạm, **Khóa tài khoản**. Nói được cách làm khi người trực mất cả điện thoại lẫn mã khôi phục (mục 1.7).
7. Duyệt và chi một khoản hoàn do người khác tạo.
8. Trên điện thoại của mình: kiểm 3 cài đặt Google Chat ở mục 12.1 (khóa màn hình, ẩn nội dung trên màn hình khóa, tắt email thông báo). Nói được 5 bước xóa tin Chat khi người gửi form xin xóa (mục 12.2) và việc cần làm khi nhận tin **FAIL** (mục 17.1).

Bài tập kế toán: cùng chủ đầu tư đọc **Nhật ký tiền** một ngày trên Desk tập; đối chiếu theo cách thanh toán.

**Xác nhận đã học** (chủ đầu tư giữ ở OTTIMO, không gửi đội):

| Họ tên | Bộ phận | Ngày học | Làm được các bài tập (Có/Chưa) | Chữ ký nhân viên | Chữ ký người đào tạo |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
