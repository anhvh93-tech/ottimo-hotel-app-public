# Hướng dẫn Chủ đầu tư và Quản lý – OTTIMO Desk v1.0

- Dành cho: **chủ đầu tư (OWN)**, **quản lý (MGR)**, và người làm **kế toán/đối soát** cùng chủ đầu tư
- Thiết bị: **máy tính hoặc laptop riêng** của anh/chị, địa chỉ `desk.ottimo.vn`. Máy quầy chỉ dùng khi duyệt tại quầy, xong đăng xuất ngay.
- Áp dụng cho: **OTTIMO Desk v1.0** (bản `v1.0.0`), chạy thật từ **thứ Hai 02/11/2026**
- Lập: BA · 30/10/2026 · Bộ hướng dẫn theo bộ phận, bản 1.10 – 04/11/2026 (gộp sau bản 1.9), **áp dụng từ v1.0.4**: Desk chặn cả `booking@` (mục 1.6a, 1.9); Desk giữ ngày kết thúc HĐ khi gia hạn, **Trả sớm** chọn đúng nhánh (mục 7.3); lễ tân có thể hỏi anh/chị số chờ hoàn của **Trả sớm** do người khác tạo (mục 7.3); sửa theo review DOM: câu in đậm "Tới v1.0.3, Desk chỉ chặn được `info@`" (mục 1.6a), v1.0.5 hiện tổng số đang chờ hoàn (mục 7.3); sửa theo DOM lượt 3: bảng duyệt – **Nhận phòng khi buồng chưa sẵn sàng** chỉ cho căn `VD`, `CL`, căn có khách thì từ chối (mục 4); bản 1.9 – 04/11/2026, **áp dụng từ v1.0.4**: khối **Đặt lại xác thực 2 bước** cho người đã bật 2 bước mà mất cả điện thoại lẫn mã khôi phục, thay cách khóa tài khoản rồi tạo tài khoản mới; nút **Khác…** ở **Người dùng & vai** (mục 1.6a, 1.7, 1.8, 1.9, 14.1, 17, 18.2; BUG-R4-032; sửa cùng ngày theo review SEC, PO: chỉ quản lý và lễ tân trưởng phải bật lại ngay, sale/CTV nên bật, buồng phòng/bảo trì tùy chọn, đặt lại mật khẩu luôn khi điện thoại bị lấy cắp hoặc có lưu mật khẩu, khóa cũng đăng xuất mọi máy, một tài khoản chủ đầu tư, câu báo khi 2 bước đã đổi ở chỗ khác; sửa theo SEC lượt 2: không phải chủ đầu tư đổi thì đặt lại mật khẩu ngay, tài khoản chủ đầu tư thứ hai chỉ cho người khác); bản 1.6 – 04/11/2026, **áp dụng từ v1.0.4** (bản đang chạy là v1.0.3; tới khi chủ đầu tư báo v1.0.4 đã lên, làm như cũ): tiêu đề thư bảo mật mới theo CPY ("Security notice: 2-step verification was reset", "Security notice: receiving account update", thư hủy lịch đổi tài khoản nhận cùng tiêu đề), app nhân viên có bước nhập mã 2 bước, đổi mật khẩu tạm ngay trên app, bật 2 bước làm trên Desk, yêu cầu hoàn thay thế giữ nơi nhận khi các yêu cầu cũ chung một nơi nhận do một người nhập; sửa cùng ngày theo review DOM: khối **Ngày cuối của người nghỉ** (mục 1.9, áp dụng ngay), tham số `privacy_notice_version` chỉ đổi đúng ngày thay tờ v2 (9.2), yêu cầu hoàn thay thế (4), mặc định 2 bước và kiểm căn trên app (1.8, 1.9); sửa theo DOM lượt 2 và SEC: khối **Ngày cuối của người nghỉ** có thứ tự riêng cho người bị cho thôi việc, không Mở khóa lại, chìa/mã/mật khẩu dùng chung, đăng xuất app nhân viên, căn HĐ thuê tháng đổi mã trong 7 ngày (1.9); gọi người trực trước mọi lần Lưu `privacy_notice_version` (9.2); sửa theo DOM lượt 3 và SEC: gỡ phòng Google Chat theo thứ tự mục 1.9 (12.1), người nghỉ êm Đăng xuất app trước bước 3 (1.9); áp dụng ngay: người nghỉ hẳn thì Khóa tài khoản rồi Xóa email, Tạm khóa do sai mật khẩu vẫn nhận thư (SEC M18-08) (mục 1.6a, 1.8, 1.9, 4); bản 1.5 (tách từ Sổ tay sử dụng OTTIMO Desk v1.0, bản nội dung 1.5; sửa theo review DOM, SEC, UXD, QA ngày 30/10; thêm phòng Google Chat, xóa theo yêu cầu người gửi, phòng Báo động theo SEC, ESC-041, ESC-042; bản 1.3 ngày 01/11 thêm giá ước tính trên website và đếm yêu cầu theo ngôn ngữ – mục 9.1a – áp dụng khi gói website LP-v2 phát hành; bản 1.5 ngày 03/11 viết lại mục 7.3 khách trả phòng sớm theo nút **Trả sớm** của v1.0.2 và bảng quyết định ký quỹ HĐ thuê tháng theo ESC-048, mục 15.5; bản 1.6 ngày 04/11 thêm trang **Bảo mật tài khoản** và email nhận thông báo bảo mật của v1.0.3, mục 1.6, 1.6a, 1.9, 15.1; bản 1.7 ngày 03/11, áp dụng cùng 1.6 khi v1.0.3 lên: sửa theo review DOM và ARC – bảng **Thư nào – làm gì** cho 4 loại thư, chọn hộp thư riêng, Desk chỉ chặn `info@`, kiểm sáng tới khi đội bảo mật báo bỏ, thứ tự nhập email, vai dùng app nhân viên chưa bật 2 bước, mất cả điện thoại lẫn mã khôi phục thì gặp tận mặt và tạo tài khoản mới theo SEC – mục 1.6a, 1.7, 1.9, 2.2, 10.1, 15.1; bản 1.8 ngày 04/11, áp dụng ngay: một đơn có thể có hơn một yêu cầu hoàn – cộng các yêu cầu còn mở (chờ duyệt và đã duyệt chưa chi), đối chiếu với dòng **Hoàn lại khách** trên Phiếu thanh toán trước khi từ chối; yêu cầu thay thế kiểm nơi nhận trước khi duyệt; đơn HĐ thuê tháng không hoàn theo khối này; trả phòng không tạo lại khoản Trả sớm – mục 4, 7.3; BUG-R4-025, sửa cùng ngày theo review DOM; sửa cùng ngày theo QA đọc staging: nhận ra yêu cầu thay thế theo cặp dòng **Đã tự đóng** – **Gửi yêu cầu duyệt** ở Nhật ký thao tác tiền, không theo chữ "trả thừa" (cột lý do có thể hiện mã `overpayment`, BUG-R4-026), Desk có thể đóng cả yêu cầu đã duyệt chưa chi và xóa nơi nhận – mục 4 bước 4–5; sửa theo DOM lượt 2: người gửi/người làm "thường", ca người vừa sửa folio không tự duyệt, dòng BUG-R4-026 ở mục 15.6)
- Tài liệu không chứa mật khẩu, mã 2 bước, mã khôi phục, số tài khoản, mã cửa hay số giấy tờ. Khi đào tạo, anh/chị cũng không ghi những thứ này lên bảng hay vào tài liệu phát tay.
- **Tài liệu nội bộ OTTIMO – không chuyển tiếp cho người ngoài OTTIMO, không gửi vào nhóm chat, không chụp, không đăng lên mạng. Nghỉ việc hoặc hết hợp tác: xóa tệp trên máy và báo chủ đầu tư.** Bộ hướng dẫn chỉ do chủ đầu tư gửi, và không bao giờ có ô đăng nhập hay hỏi mật khẩu; tệp "hướng dẫn" nhận từ người khác thì không mở, báo chủ đầu tư.

<!-- Nguồn: product/docs/manual/user-manual-v1.0.md bản 1.5 mục 0.2–0.9, chương 1, 2.4 (phần OWN), 2.14a bước 6, 4.3, 5.1–5.8; day-one-guide.md mục 6, 9, 10; decision-log 29/10 (1 tài khoản giữ 6 vai), 30/10 (ESC-040 A; ORC phân xử C1). Bản 1.2: mục 12.1–12.2, 17.1 theo rounds/round-03/outputs/SEC/esc041-gchat-full-details.md mục L2.2, L2.4 (★4, ★7), ESC-041, ESC-042 (B), decision-log 30/10; phòng Báo động theo ESC-029 A, product/infra/server/bin/ops-check.sh, rounds/round-03/outputs/OPS/inv-production-steps.md phần 6. -->

## Cách đọc tệp này

- Chữ **in đậm** là tên nút, tên màn hình, tên ô đúng như trên Desk. Ảnh màn hình có mã ở dưới ảnh (ví dụ C2-05). Khung nét đứt ghi **Chưa có ảnh** hoặc **Ảnh mới · chờ chụp** là ảnh đang chờ chụp: cứ làm theo chữ.
- Mục ghi **Chỉ chủ đầu tư** thì quản lý không thấy menu.
- Khung **Tạm ở v1.0** là việc Desk chưa làm được và cách làm thay. Mọi cách tạm tới v1.0.3 và các bản sau gom ở **mục 15**.
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

**Sắp hết mã khôi phục:** Desk nhắc "Sắp hết mã khôi phục". Trên máy riêng: **tên của mình → Bảo mật tài khoản → khối Xác thực 2 bước → Tạo bộ mã mới** (trước v1.0.3: **tên của mình → Xác thực 2 bước → Tạo bộ mã mới**). Bộ cũ hết hiệu lực ngay. Cất bộ mới như mục 1.3 bước 5.

[ẢNH: G1-01-Bảo mật tài khoản, khối Xác thực 2 bước, Tạo bộ mã mới]

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

Menu gồm: **Đổi mật khẩu** · **Bảo mật tài khoản** · **Ngôn ngữ giao diện** · **Giao diện** (Theo máy / Sáng / Tối) · **Đăng xuất**. Trước v1.0.3, mục **Bảo mật tài khoản** có tên **Xác thực 2 bước**.

Trang **Bảo mật tài khoản** có hai khối: **Xác thực 2 bước** (mục 1.3, 1.4) và **Email nhận thông báo bảo mật** (mục 1.6a).

[ẢNH: C0-06-Menu Tài khoản]

### 1.6a Email nhận thông báo bảo mật (có từ v1.0.3)

> **Có từ v1.0.3.** Tới khi v1.0.3 lên, Desk chưa có khối này. **Sau khi lên, chủ đầu tư vẫn kiểm bảo mật mỗi sáng tới khi đội bảo mật báo bỏ** (mục 2.2). Thấy thư đầu tiên về hộp thư **chưa** phải lúc bỏ. Thứ tự nhập email ngày v1.0.3 lên: mục 15.1.
>
> Nếu đội báo **tạm quay về bản trước**: menu trở lại tên **Xác thực 2 bước** và khối email tạm ẩn. Email đã lưu vẫn dùng, thư báo bảo mật vẫn tới. Không cần nhập lại. Cần đổi email gấp thì báo chủ đầu tư.

OTTIMO gửi thư báo tới địa chỉ này khi có việc quan trọng với tài khoản: dùng mã khôi phục, đặt lại 2 bước, đổi tài khoản nhận cọc, đổi email. Đọc và xử lý theo bảng **Thư nào – làm gì** ở cuối mục. **Chủ đầu tư và quản lý phải có email này.** Chưa có, Desk hiện dòng nhắc trên đầu trang: "Tài khoản của bạn chưa có email nhận thông báo bảo mật. Thêm email để được báo khi có thay đổi quan trọng." Bấm **Thêm email** để mở đúng khối. **Để sau** chỉ ẩn dòng nhắc trong lần làm việc này.

**Chọn hộp thư nào:**
- Dùng **email riêng chỉ anh/chị đọc**, ví dụ `ten.rieng@example.test`.
- **Không dùng hộp thư chung** của cơ sở: `info@ottimo.vn`, `booking@ottimo.vn`, Gmail dùng cho Booking.com/Agoda/Airbnb, hộp thư của quầy, email của người nhà. Lý do: ai đọc được hộp thư chung cũng đọc và xóa được thư báo của anh/chị.
- **Tới v1.0.3, Desk chỉ chặn được `info@`.** **Từ v1.0.4** chặn cả `booking@` của cơ sở, kể cả dạng có dấu cộng như `info+…@`, `booking+…@`. Các hộp thư chung khác (Gmail dùng cho OTA, hộp thư của quầy…) Desk không nhận ra, anh/chị phải tự tránh.
- Hộp thư này **không đăng nhập trên máy quầy, máy tính bảng của cơ sở** hay máy dùng chung, và **không cài tự chuyển tiếp** sang hộp thư khác. Nên bật đăng nhập 2 bước cho chính hộp thư đó.

**Tự nhập email của mình** (mỗi người tự làm, không nhờ người khác gõ hộ):
1. Bấm **tên của mình → Bảo mật tài khoản**. Khối **Email nhận thông báo bảo mật** ở dưới khối **Xác thực 2 bước**. Góc phải khối ghi **Chưa có** hoặc **Đã có**.
2. Chưa có email: nhập vào ô **Email**, rồi bấm **Thêm email**. Đã có: bấm **Đổi email**, nhập địa chỉ mới, bấm **Lưu email**.
3. Hộp **Lưu email nhận thông báo bảo mật** hiện **Địa chỉ mới**. Đọc lại từng ký tự. Nhập **Mật khẩu đăng nhập** và **Mã trong ứng dụng xác thực (6 số)**. Bấm **Lưu email**.
   - Địa chỉ là `info@` (từ v1.0.4: cả `booking@`): **sau khi** bấm **Lưu email**, Desk báo dưới ô **Email**: "Đây là hộp thư chung của cơ sở. Thông báo bảo mật cần tới một email riêng." Mật khẩu và mã **không bị tính là sai**, mã chưa bị dùng. Nhập một email riêng khác.
4. Desk báo "Đã lưu. Thông báo đã gửi tới địa chỉ này. Sau 15 phút chưa thấy thư, hãy xem mục Spam hoặc kiểm tra lại địa chỉ." (lần đầu thêm) hoặc "Đã lưu. Thông báo đã gửi tới địa chỉ mới và địa chỉ cũ. Sau 15 phút chưa thấy thư, hãy xem mục Spam hoặc kiểm tra lại địa chỉ." (khi đổi). Mở hộp thư trên máy hoặc điện thoại riêng, tìm thư **OTTIMO – Security notice: notification email changed**. Thư nằm trong Spam: đánh dấu **Không phải thư rác**.

[ẢNH: C0-12-Khối Email nhận thông báo bảo mật]
[ẢNH: C0-13-Hộp Lưu email nhận thông báo bảo mật]

- "Mật khẩu hoặc mã chưa đúng. Kiểm tra lại rồi nhập mã mới.": chờ ứng dụng hiện mã mới, nhập lại. Mỗi mã chỉ dùng một lần.
- Sai **5 lần**, Desk báo "Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại." (khoảng 15 phút). Trong lúc đó **mọi thao tác cần mật khẩu và mã đều chờ** (duyệt, đổi tài khoản nhận, cấp quyền máy, khóa tài khoản…), không riêng khối email. Anh/chị không tự sai 5 lần mà vẫn thấy câu này: quản lý báo chủ đầu tư, chủ đầu tư gọi đội.
- "Địa chỉ này đã được lưu. Không có gì thay đổi.": địa chỉ đã đúng, không cần làm gì.
- "Email chưa đúng dạng, ví dụ ten@example.com.": gõ lại địa chỉ.
- **Xóa email**: sau khi xóa, anh/chị không nhận thông báo bảo mật qua email nữa. Chủ đầu tư và quản lý phải có email này: muốn thay địa chỉ thì bấm **Đổi email**, không xóa.
- Desk hiện **đủ** địa chỉ email ở khối này và ở **Người dùng & vai** (không che). **Không chụp màn hình** các màn này để gửi chat hay báo lỗi: báo lỗi bằng lời, chép đủ câu Desk báo. Thư báo và thông báo trong app không ghi địa chỉ.

**Ai nhận thư khi email thay đổi.** Mỗi lần email của một tài khoản được thêm, đổi hoặc xóa, OTTIMO gửi thư **Security notice**:

| Gửi tới | Khi nào |
|---|---|
| Địa chỉ mới | Khi thêm hoặc đổi |
| Địa chỉ cũ | Khi đổi hoặc xóa (lần đầu thêm thì không có địa chỉ cũ) |
| Các chủ đầu tư | Mọi lần, kể cả khi chính người đó tự đổi hoặc chủ đầu tư đổi cho nhân viên |

Thư không ghi địa chỉ email, không có link, không hỏi mật khẩu hay mã.

**Thư nào – làm gì.** Tiêu đề thư luôn bắt đầu bằng "OTTIMO – ", ghi tiếng Anh rồi tiếng Việt. Người có tài khoản đó và các chủ đầu tư đều nhận thư (dòng 3: các chủ đầu tư).

| Tiêu đề thư | Gửi khi | Việc này mình **không** biết trước thì làm gì |
|---|---|---|
| **Security notice: a recovery code was used** / Thông báo bảo mật: đã dùng mã khôi phục | Một tài khoản (kể cả của mình) đăng nhập bằng mã khôi phục | **Thư về chính mình:** mở Desk bằng cách **gõ địa chỉ**, **đổi mật khẩu**, **Tạo bộ mã mới** (mục 1.4), rồi gọi chủ đầu tư (chủ đầu tư: gọi đội). **Thư về nhân viên** (chủ đầu tư): **gọi điện** cho người đó theo số đã lưu sẵn. Người đó nói không phải mình: **Khóa tài khoản** ngay (mục 1.9), xem **Tổng quan → Cần chú ý**, gọi đội |
| **Security notice: 2-step verification was reset** / Thông báo bảo mật: xác thực 2 bước đã được đặt lại (**từ v1.0.4**; ở v1.0.3: **Security notice: two-step sign-in was reset** / Thông báo bảo mật: đăng nhập 2 bước đã được đặt lại) | 2 bước của một tài khoản bị đặt lại. Thư có thể ghi "bởi đội kỹ thuật OTTIMO" | Làm như dòng trên. Thư ghi "bởi đội kỹ thuật OTTIMO" mà anh/chị không đang làm thủ tục khôi phục với đội: **gọi đội ngay theo số đã biết**, không theo số nào ghi trong thư. **Từ v1.0.4**, chủ đầu tư cũng nhận thư này mỗi lần chính mình bấm **Đặt lại xác thực 2 bước** cho một người (mục 1.9; thư không có chữ "bởi đội kỹ thuật OTTIMO"): đó là việc mình biết trước, không cần làm gì |
| **Security notice: receiving account update** / Thông báo bảo mật: cập nhật tài khoản nhận chuyển khoản (**từ v1.0.4**; ở v1.0.3: **Notice: the deposit receiving account was changed** / Thông báo: tài khoản nhận cọc đã thay đổi) | Tài khoản nhận chuyển khoản (VietQR) được lên lịch đổi, hoặc lịch đổi bị **hủy**. Từ v1.0.4 thân thư nói rõ: đặt lịch – "A new receiving bank account was set, effective from {ngày}." / "Tài khoản ngân hàng nhận chuyển khoản mới đã được đặt, có hiệu lực từ ngày {ngày}."; hủy lịch – "The receiving bank account change scheduled for {ngày} was cancelled." / "Lịch đổi tài khoản ngân hàng nhận chuyển khoản từ ngày {ngày} đã được hủy."; có lúc chỉ có câu chung "…vừa được cập nhật" | Làm theo mục 10.2: chủ đầu tư **Hủy lịch**, đổi mật khẩu, tạo bộ mã khôi phục mới, báo đội. Lễ tân **ngừng gửi mã VietQR** tới khi chủ đầu tư xác nhận |
| **Security notice: notification email changed** / Thông báo bảo mật: email nhận thông báo đã thay đổi | Email của một tài khoản được thêm, đổi hoặc xóa | **Thư về email của mình:** không trả lời thư. Mở Desk bằng cách **gõ địa chỉ**, **đổi mật khẩu**, báo chủ đầu tư ngay trong ngày. **Thư về email của nhân viên** (chủ đầu tư): **gọi điện** hỏi người đó. Không phải người đó làm: **Khóa tài khoản** như dòng đầu |

- Ở v1.0.3, thư về tài khoản nhận cọc **không có chữ "Security notice"** (tiêu đề bắt đầu bằng "Notice:"). **Từ v1.0.4**, cả 4 loại thư đều bắt đầu bằng "Security notice:". Thư **hủy** lịch đổi tài khoản nhận cũng có tiêu đề "receiving account update", giống thư đặt lịch: đọc câu đầu của thư để biết là đặt hay hủy. Việc mình không biết trước thì vẫn làm theo dòng tài khoản nhận ở bảng trên. **Đừng lọc thư theo chữ Security notice.** Thư đầu tiên của OTTIMO vào Spam thì đánh dấu **Không phải thư rác**.
- Thư báo của OTTIMO **không có link**, không hỏi mật khẩu hay mã. Thư nào có link đăng nhập hoặc hỏi mã là thư giả: không bấm, báo chủ đầu tư.
- **Từ v1.0.4**, thư dùng đúng chữ trên Desk: "xác thực 2 bước" (không còn "đăng nhập 2 bước"), "chủ đầu tư" (không còn "chủ cơ sở"), "tài khoản nhận chuyển khoản" (không còn "tài khoản nhận cọc"). Chân thư: "Thư bảo mật của OTTIMO không bao giờ có đường liên kết và không bao giờ hỏi mật khẩu hay bất kỳ mã nào."
- Hỏi lại ai về một thư báo: **gọi điện** theo số đã lưu sẵn, **không hỏi qua Zalo hay tin nhắn** (tài khoản chat cũng có thể đã bị người khác chiếm).

### 1.7 Quên mật khẩu, mất điện thoại

| Tình huống | Làm gì |
|---|---|
| Quản lý quên mật khẩu | **Báo chủ đầu tư.** Desk không có nút "quên mật khẩu". Chủ đầu tư **Đặt lại mật khẩu**, đưa mật khẩu tạm tận tay |
| Chủ đầu tư hoặc quản lý mất điện thoại, còn mã khôi phục | Ở màn nhập mã, bấm **Mất điện thoại? Dùng mã khôi phục**, nhập một mã, bấm **Đăng nhập bằng mã khôi phục**. Desk mở **Đăng ký lại trên điện thoại mới**: làm lại như mục 1.3, trên máy riêng. **Làm xong đăng ký lại ngay, không bỏ dở.** Quản lý: rồi **báo chủ đầu tư** để **Đặt lại mật khẩu** cho mình (Desk đăng xuất trên mọi máy, kể cả máy bị mất) |
| Quản lý (người trực) mất cả điện thoại lẫn mã khôi phục | Người đó **báo chủ đầu tư**, không xin mã của người khác. Chủ đầu tư **gặp tận mặt** người đó rồi mới làm, **không làm theo tin nhắn** hay cuộc gọi (người giả danh cũng nhắn xin được). Chưa gặp được ngay: **Khóa tài khoản** của người đó trước (mục 1.9; khóa cũng đăng xuất người đó trên mọi máy, kể cả điện thoại bị mất), gặp rồi mới làm tiếp. **Từ v1.0.4:** chủ đầu tư, trên máy riêng, lúc người đó ngồi cùng, bấm **Đặt lại xác thực 2 bước** cho người đó (mục 1.9, khối **Đặt lại xác thực 2 bước**); đã khóa thì **Mở khóa** sau đó. Người đó **giữ tài khoản cũ** (tên đăng nhập, vai, email, lịch sử thao tác), đăng nhập ngay trên laptop riêng bằng mật khẩu của mình. Desk mở **Bật xác thực 2 bước**: người đó bật lại trên điện thoại mới, cất 10 mã khôi phục mới (mục 1.3), xong mới rời đi. **Ở v1.0.3** (tới khi chủ đầu tư báo v1.0.4 đã lên) chưa có nút này. Chủ đầu tư, trên máy riêng: (1) **Khóa tài khoản** của người đó ngay; (2) **Thêm người dùng** mới cho chính người đó, **tên đăng nhập mới**, đúng các vai cũ (mục 1.9); (3) đưa mật khẩu tạm tận tay; người đó đăng nhập lần đầu trên laptop riêng và bật 2 bước trên điện thoại mới; (4) **ngay sau khi bật 2 bước**, người đó nhập **email nhận thông báo** ở **tên của mình → Bảo mật tài khoản** (mục 1.6a; vai quản lý bắt buộc có email). Tài khoản cũ để khóa, không xóa (giữ nhật ký). Ở cả hai bản: **không nhờ đội kỹ thuật đặt lại 2 bước**; **Đặt lại mật khẩu không gỡ 2 bước** |
| Buồng phòng, bảo trì, lễ tân trưởng (dùng app nhân viên) đã bật 2 bước rồi mất cả điện thoại lẫn mã khôi phục | Gặp tận mặt như dòng trên (chưa gặp được ngay: **Khóa tài khoản** trước). **Từ v1.0.4:** **Đặt lại xác thực 2 bước** cho người đó (mục 1.9). Người đó giữ tài khoản cũ, đăng nhập lại Desk và app nhân viên bằng tên đăng nhập, mật khẩu của mình; Desk và app không hỏi mã nữa. **Lễ tân trưởng:** bật lại 2 bước trên Desk ngay buổi đó (bắt buộc – mặc định đội chọn, mục 1.9 bước 8; anh/chị đổi được). **Buồng phòng, bảo trì:** bật lại chỉ khi người đó muốn (tùy chọn). **Ở v1.0.3:** bước (1)–(3) ở dòng trên, tên đăng nhập mới, đúng các vai cũ. Ở tài khoản mới, người đó **không bật 2 bước** (mục 1.9 bước 8) và đăng nhập app nhân viên bằng tên đăng nhập mới. Bước (4) không bắt buộc; lễ tân trưởng nên nhập email (mục 1.6a). Không nhờ đội đặt lại |
| Chủ đầu tư mất cả điện thoại lẫn mã khôi phục | Làm theo thủ tục khôi phục riêng đã diễn tập với đội kỹ thuật (không ghi trong tài liệu này) |
| Chủ đầu tư quên mật khẩu | Ở v1.0 **chưa có cách khôi phục**: không ai trong Desk đặt lại được mật khẩu cho chủ đầu tư, thủ tục khôi phục riêng cũng không đổi mật khẩu. Vì vậy: lưu mật khẩu Desk trong **trình quản lý mật khẩu** ngay khi đặt (không lưu trên trình duyệt). Gõ sai **2 lần** thì dừng, mở trình quản lý mật khẩu xem lại: gõ sai tiếp Desk sẽ khóa, và chỉ một chủ đầu tư khác mới mở được. Đã quên hẳn: gọi đội kỹ thuật, không tự thử tiếp. |
| Mất điện thoại hoặc máy tính bảng có **app khóa cửa** | Chủ đầu tư **ngay** đổi mật khẩu tài khoản app khóa và thu hồi quyền của máy đó |
| Nghi lộ mật khẩu | Đổi mật khẩu ngay (**tên của mình → Đổi mật khẩu**), tạo bộ mã khôi phục mới, báo chủ đầu tư |

[ẢNH: G1-02-Dùng mã khôi phục]
[ẢNH: G1-03-Đăng ký lại trên điện thoại mới]

**Không ai** – chủ đầu tư, quản lý, đội kỹ thuật, ngân hàng hay OTA – hỏi mật khẩu, mã 6 số hay mã khôi phục của anh/chị. Ai hỏi thì không đưa và báo chủ đầu tư.

OTTIMO chỉ có một tài khoản chủ đầu tư, nên không ai trong Desk đặt lại được mật khẩu hay 2 bước cho chủ đầu tư. Muốn thêm tài khoản chủ đầu tư cho **một người khác** anh/chị tin cậy (ví dụ đồng sở hữu) thì báo đội trước: người đó có toàn quyền như anh/chị, và hai chủ đầu tư đặt lại được mật khẩu và 2 bước cho nhau. Không tạo tài khoản chủ đầu tư thứ hai cho chính mình. Ai nhắn hay gọi nói "đặt lại giúp" rồi xin mật khẩu, mã 6 số hay mã khôi phục là lừa đảo, kể cả khi xưng đội kỹ thuật.

### 1.8 App nhân viên

Chủ đầu tư và quản lý (có 2 bước) **chưa đăng nhập được app nhân viên** `staff.ottimo.vn` ở v1.0. App báo "Đăng nhập 2 bước sẽ có ở bản sau" (cùng lúc hiện câu "Nhập mã…" nhưng không có ô nhập mã – lỗi chữ, đang sửa).

Hệ quả cho OTTIMO hiện nay: tài khoản người trực giữ vai quản lý nên **không vào được app nhân viên**. Việc dọn đánh dấu trên Desk (**Vận hành → Buồng phòng → Làm xong**), phiếu sửa làm trên Desk (**Vận hành → Bảo trì**). **Không ai bấm kiểm phòng được** (`VC` → `VI`). Người trực tự đi kiểm căn theo 12 mục rồi mới bấm **Làm xong** (`02` mục 13.2a). Lễ tân nhận khách vào căn `VC` như thường.

> **Áp dụng từ v1.0.4** (khi chủ đầu tư báo v1.0.4 đã lên; tới lúc đó làm như trên). Quyết định ORC 04/11, MOB P4-50:
> - **App nhân viên có bước nhập mã.** Tài khoản đã bật 2 bước (chủ đầu tư, quản lý, người trực 6 vai, và ai đã bật) đăng nhập app bằng mật khẩu rồi **mã 6 số** trong ứng dụng xác thực. Mất điện thoại: **Mất điện thoại? Dùng mã khôi phục**. Sai 5 lần hoặc quá 5 phút: app báo "Bước nhập mã đã hết hạn. Đăng nhập lại bằng mật khẩu."
> - **Mật khẩu tạm đổi ngay trên app**: màn **Đặt mật khẩu của bạn** (**Mật khẩu hiện tại** là mật khẩu tạm, **Mật khẩu mới**, **Nhập lại mật khẩu mới**, bấm **Lưu và vào ứng dụng**). Không cần đổi trên Desk trước.
> - **Bật 2 bước chỉ làm trên Desk** (trên máy tính, quét mã bằng chính điện thoại của người đó, cất 10 mã khôi phục). App không có màn bật. Tài khoản phải có 2 bước mà chưa bật, hoặc vừa vào app bằng mã khôi phục: app báo "Tài khoản của bạn cần bật xác thực 2 bước trước khi làm việc." và "Mở OTTIMO Desk trên máy tính để bật xác thực 2 bước, rồi đăng nhập lại ở đây."
> - Lời dặn "không bật 2 bước ở v1.0.x" cho buồng phòng, bảo trì, lễ tân trưởng **hết hiệu lực**. **Mặc định đội chọn** (anh/chị đổi được, báo đội): **lễ tân trưởng bắt buộc** bật 2 bước; **buồng phòng, bảo trì tùy chọn**. Cách làm ở mục 1.9 bước 8.
> - Người trực có vai quản lý vào được app. **Mặc định đội chọn** (anh/chị muốn giữ cách cũ thì báo đội): người trực **kiểm căn trên app** (tệp 02 mục 14.2), khoảng 1–2 phút mỗi căn, giữ mốc 11:00 và 14:00. Desk ghi ai kiểm, lúc nào, mục nào chưa đạt; căn chưa đạt tự có việc dọn lại. Cách tự kiểm rồi chỉ bấm **Làm xong** (tệp 02 mục 13.2a) chỉ dùng khi không vào được app, và ghi sổ giao ca.
> - **Sau khi chủ đầu tư Đặt lại xác thực 2 bước** cho một người (mục 1.9): app trên mọi máy của người đó về màn đăng nhập. Tài khoản có vai chủ đầu tư hoặc quản lý: app báo "Tài khoản của bạn cần bật xác thực 2 bước trước khi làm việc." Bật lại trên Desk trước, rồi đăng nhập app với mã 6 số mới. Vai khác: đăng nhập app bằng mật khẩu, app không hỏi mã cho tới khi người đó bật lại.

### 1.9 Cấp đăng nhập cho nhân viên (chỉ chủ đầu tư)

**Các vai trên Desk:**

| Vai | Dành cho | Đăng nhập 2 bước | Đăng nhập ở |
|---|---|---|---|
| **Chủ đầu tư** | Chủ đầu tư | Bắt buộc | Desk |
| **Quản lý** | Quản lý | Bắt buộc | Desk |
| **Lễ tân trưởng** | Thêm quyền duyệt trong hạn mức, nhận phòng ngoại lệ, kiểm phòng | Chưa (từ v1.0.4: **bắt buộc** – mặc định đội chọn, anh/chị đổi được; Desk tự ép dự kiến từ v1.0.5) | Desk + app nhân viên |
| **Lễ tân** | Lễ tân, người trực đêm | Chưa | Desk |
| **Buồng phòng** | Nhân viên buồng phòng | Chưa (từ v1.0.4: tùy chọn) | App nhân viên |
| **Bảo trì** | Kỹ thuật | Chưa (từ v1.0.4: tùy chọn) | App nhân viên |
| **Sale nội bộ** | Nhân viên bán hàng của OTTIMO | Không bắt buộc – nên bật | Desk (điện thoại hoặc máy tính) |
| **CTV / môi giới** | Cộng tác viên ngoài | Không bắt buộc – nên bật | Desk (điện thoại hoặc máy tính) |

Một người có thể có nhiều vai. Không có vai "Kế toán" riêng (mục 11). Khi có nhân viên thật: **mỗi người một tài khoản, đúng vai của mình**. Tới bản sửa (v1.0.3 hoặc v1.0.4), tài khoản chỉ có vai Bảo trì vào Desk chỉ xem được phiếu, chưa tạo phiếu, chưa khóa phòng được: lễ tân hoặc người trực làm (mục 15.6).

**Thêm người dùng:**
1. **Quản trị → Người dùng & vai → Thêm người dùng**.
2. Nhập **Tên hiển thị**, **Tên đăng nhập** (chữ thường không dấu, ví dụ `lan.hk`).
3. **Mật khẩu tạm** do Desk tạo sẵn (bấm **Tạo mật khẩu khác** nếu muốn).
4. Chọn một hoặc nhiều vai. Bấm **Tạo tài khoản**.
5. Xác nhận bằng mật khẩu và mã 6 số.
6. Desk hiện **Mật khẩu tạm của …** **một lần**. Đưa tận tay người dùng. Không gửi qua chat.
7. Ngồi cùng người đó lần đăng nhập đầu: đổi mật khẩu tạm. Người có vai quản lý: làm trên laptop riêng (không phải máy quầy), bật 2 bước trên điện thoại riêng của họ, cất mã khôi phục như mục 1.3 bước 5.
8. **Buồng phòng, bảo trì, lễ tân trưởng dùng app nhân viên: dặn họ không bật đăng nhập 2 bước ở v1.0.x.** App nhân viên chưa đăng nhập được bằng 2 bước (app báo "…Đăng nhập 2 bước sẽ có ở bản sau. Nhờ chủ đầu tư hỗ trợ đăng nhập."): bật thì người đó mất app nhân viên. **Lỡ bật:** đăng nhập Desk bằng mật khẩu và mã → **tên của mình → Bảo mật tài khoản → Tắt xác thực 2 bước** (xác nhận bằng mật khẩu và mã) → đăng nhập lại app bằng mật khẩu như cũ. Người đó mất cả điện thoại lẫn mã khôi phục: anh/chị **gặp tận mặt**, khóa tài khoản cũ, tạo tài khoản mới (tên đăng nhập mới, không bật 2 bước) theo mục 1.7. Không nhờ đội đặt lại 2 bước, không làm theo tin nhắn. Sale nội bộ, CTV chỉ dùng Desk: tự bật được, nên bật. **Từ v1.0.4** lời dặn này hết hiệu lực: app đăng nhập được bằng 2 bước, mật khẩu tạm đổi ngay trên app; bật 2 bước vẫn chỉ làm trên Desk (mục 1.8). **Từ v1.0.4, mặc định đội chọn** (anh/chị đổi được, báo đội): **Lễ tân trưởng bắt buộc 2 bước.** Desk chưa tự ép (dự kiến v1.0.5), nên anh/chị làm 3 việc: tạo tài khoản; ngồi cùng người đó bật 2 bước trên Desk ngay buổi đầu (quét mã bằng điện thoại riêng của họ, cất 10 mã khôi phục như mục 1.3); nhìn tận mắt khối **Xác thực 2 bước** ở trang **Bảo mật tài khoản** của họ đã bật, rồi mới giao việc. **Buồng phòng, bảo trì: tùy chọn.** Chỉ bật khi người đó có điện thoại riêng và giữ được mã khôi phục; không cần khuyến khích. Người đã bật mà mất cả điện thoại lẫn mã khôi phục: anh/chị gặp tận mặt rồi **Đặt lại xác thực 2 bước** cho người đó (khối **Đặt lại xác thực 2 bước** cuối mục này), không tạo tài khoản mới.

[ẢNH: C1-07-Người dùng và vai]
[ẢNH: C1-08-Thêm người dùng]
[ẢNH: C1-09-Mật khẩu tạm hiện một lần]

Nhân viên buồng phòng, bảo trì (và lễ tân trưởng dùng app): lần đầu, và sau mỗi lần **Đặt lại mật khẩu**, đổi mật khẩu tạm trên `desk.ottimo.vn` trước, rồi mới đăng nhập app nhân viên (tệp 03, 04 mục 1). App chưa có màn đổi mật khẩu tạm: còn mật khẩu tạm mà vào app thì mọi màn báo "Chưa tải được … Có thể do mạng yếu" (mục 15.6). **Từ v1.0.4**: đổi mật khẩu tạm ngay trên app, không cần Desk trước (mục 1.8).

> **Áp dụng từ v1.0.4** (khi chủ đầu tư báo v1.0.4 đã lên; tới lúc đó các nút nằm thẳng trên dòng như danh sách dưới): cột **Thao tác** chỉ còn **Sửa vai** và **Khác…**. Tài khoản đã khóa có thêm nút **Mở khóa** ngay sau **Khác…**. Bấm **Khác…** để mở **Đặt lại mật khẩu**, **Khóa tài khoản** (chỉ hiện với tài khoản đang dùng) và **Đặt lại xác thực 2 bước** (chỉ hiện với người đã bật 2 bước). Dòng của chính anh/chị không có **Khác…**: không ai tự đặt lại 2 bước cho mình. Mất mạng thì các nút này mờ.

**Các việc khác** (cột **Thao tác** ở dòng người dùng):
- **Sửa vai** → chọn vai → **Lưu vai**. Người đó bị đăng xuất ngay trên mọi máy.
- **Đặt lại mật khẩu**: dùng khi nhân viên quên mật khẩu, nghi lộ mật khẩu, mất điện thoại. Desk hỏi **Mật khẩu đăng nhập** và **Mã trong ứng dụng xác thực (6 số)**. Người đó bị đăng xuất trên mọi máy và phải đổi mật khẩu tạm ở lần đăng nhập tới. **Đặt lại mật khẩu không gỡ khóa và không gỡ 2 bước**: tài khoản đang bị khóa thì bấm **Mở khóa**; người có 2 bước mất cả điện thoại lẫn mã khôi phục thì làm theo mục 1.7 (từ v1.0.4: **Đặt lại xác thực 2 bước**).
- **Khóa tài khoản**: dùng khi nghỉ việc, hết hợp tác CTV, hoặc mất điện thoại. Desk hỏi **Mật khẩu đăng nhập** và **Mã trong ứng dụng xác thực (6 số)**. **Mở khóa** khi cần dùng lại.
- **Đặt lại xác thực 2 bước** (từ v1.0.4, trong **Khác…**): dùng khi người đã bật 2 bước mất cả điện thoại lẫn mã khôi phục. Xem khối **Đặt lại xác thực 2 bước** cuối mục này.
- **Sửa email** (có từ v1.0.3, chỉ chủ đầu tư): đặt email nhận thông báo bảo mật cho nhân viên. Xem bên dưới.
- Trạng thái **Tạm khóa do sai mật khẩu**: chờ hết thời gian khóa, hoặc bấm **Mở khóa**. Người đó nói không gõ sai: hỏi lại, rồi đổi mật khẩu cho họ (**Đặt lại mật khẩu**) và xem **Cần chú ý**.
- Trạng thái **Chờ đổi mật khẩu tạm**: người đó chưa đăng nhập lần đầu.
- **Người nghỉ hẳn** (nhân viên nghỉ việc, CTV hết hợp tác) – **áp dụng ngay**: làm theo khối **Ngày cuối của người nghỉ** ngay dưới danh sách này (gồm **Khóa tài khoản** rồi **Xóa email**; v1.0.3 đang gửi thư như vậy, v1.0.4 giữ nguyên). Tài khoản người nghỉ hẳn **không Mở khóa lại**. Khóa tạm (nghỉ phép, nghi lộ mật khẩu, mất điện thoại): chỉ **Khóa tài khoản**, **giữ email**.
- **Tạm khóa do sai mật khẩu** là việc **Desk tự làm** khi có người gõ sai mật khẩu nhiều lần, **khác** nút **Khóa tài khoản**. Tài khoản ở trạng thái này **vẫn nhận** thư bảo mật về chính mình (có thể đang bị dò mật khẩu), và máy đang đăng nhập **không** bị đăng xuất. Người đó nói không gõ sai: làm như dòng trên (hỏi lại, **Đặt lại mật khẩu**, xem **Cần chú ý**); cần chặn ngay trên mọi máy thì bấm **Khóa tài khoản**.

**Ngày cuối của người nghỉ** (nhân viên nghỉ việc, CTV hết hợp tác) – **áp dụng ngay**, chủ đầu tư làm. Chỉ **Khóa tài khoản** thì chưa đủ: người nghỉ vẫn còn ở phòng Google Chat (tin có thông tin khách), còn biết mã cửa, còn giữ việc dở.

**Thứ tự:**
- **Người nghỉ êm:** bước 1 → 8 theo số (riêng **Đăng xuất** app nhân viên ở bước 7 làm trước bước 3). Bước 3, 5, 6, 7 làm **cuối ca cuối cùng** của người đó, không để sang hôm sau.
- **Người bị cho thôi việc:** **ngay lúc báo, trong cùng một lần ngồi máy**, làm liền: bước 3 → phần app khóa của bước 6 (gỡ ủy quyền, vô hiệu mã/thẻ nhân viên) → bước 5 → bước 7 → phần còn lại của bước 6. Sau đó mới làm bước 1, 2, 4, 8 (anh/chị cùng người đó đếm két tại quầy).

1. **Tiền mặt quầy và sổ giao ca:** người đó đếm két, đối chiếu tiền mặt (mục 11.5, tệp 02 mục 12.4), bàn giao sổ giao ca; anh/chị đếm lại và ký nhận. Người nghỉ êm làm **trước** khi khóa, vì khóa xong người đó không đăng nhập để chốt ca được.
2. **Việc người đó đang giữ dở:** ghi mã từng việc vào sổ giao ca, giao người khác làm tiếp:
   - yêu cầu website người đó đã **Nhận xử lý**; phiếu sửa đã **Nhận việc** mà chưa **Sửa xong**; việc dọn đang làm dở;
   - yêu cầu hoàn **còn mở** do người đó tạo (mục 8.3): nơi nhận còn trống thì người khác nhập, không phải người nghỉ. Chỉ còn anh/chị thì nhập **Chuyển khoản** rồi duyệt và chi; anh/chị nhập **Tiền mặt** thì không tự duyệt được khoản đó.
3. **Khóa tài khoản** (dòng **Khóa tài khoản** ở trên). Tài khoản người nghỉ hẳn **không Mở khóa lại**: mật khẩu, 2 bước và mã khôi phục cũ vẫn còn hiệu lực. Tuyển lại thì tạo tài khoản mới (tên đăng nhập mới, mật khẩu tạm mới, bật 2 bước lại nếu vai cần).
4. **Xóa email** của người đó (phần **Đặt email cho nhân viên** ngay dưới: mở hộp, bấm **Xóa email**, xác nhận bằng mật khẩu và mã 6 số). Sau bước 3, tài khoản này không nhận thư bảo mật về chính mình nữa, **trừ một** thư **Security notice: notification email changed** gửi tới địa chỉ cũ ở bước này (thư không có dữ liệu khách). Người nghỉ êm: báo trước cho người đó về thư này. Anh/chị cũng nhận một bản; các chủ đầu tư vẫn nhận bản của mình.
5. **Google Chat:** gỡ người đó khỏi phòng "OTTIMO – Yêu cầu đặt phòng" (mục 12.1). Khóa Desk **không** gỡ người đó khỏi phòng. Người đó có tài khoản `@ottimo.vn` riêng: tạm ngưng tài khoản đó trong Admin console.
6. **Chìa, mã, mật khẩu dùng chung** (những thứ người đó biết hoặc được giao):
   - thu chìa cơ, thẻ tổng, thẻ nhân viên của khóa;
   - app khóa: gỡ tài khoản ủy quyền của người đó, vô hiệu mã/thẻ nhân viên trên khóa;
   - extranet OTA (Booking.com, Agoda, Airbnb…): gỡ tài khoản riêng của người đó, hoặc đổi mật khẩu từng kênh;
   - hộp thư chung (`booking@`, hộp thư của quầy) và Gmail dùng cho OTA: đổi mật khẩu, đăng xuất mọi phiên;
   - đổi mã mở máy của điện thoại cơ sở, máy tính bảng, máy quầy; Zalo cơ sở: đăng xuất rồi đăng nhập lại;
   - đổi mã két, mật khẩu Wi-Fi quản trị, mật khẩu phát Wi-Fi (4G) của điện thoại cơ sở;
   - mã cửa: người bị cho thôi việc thì tạo mã mới cho các căn đang có khách mà người đó biết mã, giao mã mới cho khách (tệp 02 mục 7.5). Căn HĐ thuê tháng mà người đó biết mã: hẹn khách đổi mã trong 7 ngày, kể cả khi nghỉ êm.
   Không ghi mật khẩu, mã mới vào sổ giao ca, nhóm chat hay giấy dán quầy.
7. **Thiết bị:** máy riêng của người đó đã được cấp quyền thì bấm **Thu hồi** ở dòng máy (mục 1.10). App nhân viên trên điện thoại riêng: khóa tài khoản chỉ đưa app về màn đăng nhập, dữ liệu đọc ngoại tuyến (tên gọi khách, số căn, phiếu sửa) vẫn còn tới khi bấm **Đăng xuất**. Người nghỉ êm: nhờ họ bấm **Tôi → Đăng xuất** trong app trước mặt anh/chị, **trước** bước 3. Người bị cho thôi việc: nhờ họ xóa dữ liệu trang của app hoặc gỡ app; không làm thì ghi sổ giao ca, không ép.
8. **Giữ chỗ:** rà **Cần chú ý** và **Đơn đặt phòng** → **Đang hiệu lực** các giữ chỗ người đó tạo hoặc chốt. Người đó không còn nhận thông báo giữ chỗ quá hạn: giao người khác theo dõi tới khi đơn có cọc hoặc hủy.

**CTV hết hợp tác:** làm bước 3, 4 và 8; bước 7 nếu máy của CTV đã được cấp quyền (CTV không ở phòng Google Chat; lỡ có thì làm cả bước 5). **Khóa tài khoản** không xóa hoa hồng còn nợ của các đơn CTV đó đã chốt: anh/chị vẫn chi theo bảng nội bộ, và báo CTV cách nhận số liệu (CTV không còn đăng nhập để xem).

Người nghỉ là người trực duy nhất: anh/chị sắp xếp người trực quầy (chính anh/chị, hoặc người mới đã có tài khoản) **trước** khi khóa.

[ẢNH: G1-04-Hộp Khóa tài khoản]
[ẢNH: G1-05-Hộp Đặt lại mật khẩu]

**Đặt email cho nhân viên** (có từ v1.0.3, chỉ chủ đầu tư, trên máy riêng):
1. **Quản trị → Người dùng & vai**. Cột **Email** hiện địa chỉ của từng người hoặc **Chưa có**. Quản lý chưa có email: chữ **Chưa có** hiện trong khung cảnh báo.
2. Ở dòng người đó, bấm **Sửa email**.
3. Hộp **Email nhận thông báo bảo mật – {tên}**: nhập email riêng của người đó, ví dụ `ten.rieng@example.test`. Hỏi tận miệng, đọc lại cho người đó nghe, và hỏi: "Hộp thư này chỉ mình em đọc phải không?" Không dùng hộp thư chung (`info@ottimo.vn`, `booking@ottimo.vn`, Gmail dùng cho OTA, hộp thư của quầy – mục 1.6a). Bấm **Lưu email**.
4. Hộp xác nhận hiện **Địa chỉ mới** và câu "OTTIMO sẽ gửi thông báo tới địa chỉ mới, địa chỉ cũ (nếu có) và các chủ đầu tư." Nhập **Mật khẩu đăng nhập** và **Mã trong ứng dụng xác thực (6 số)**. Bấm **Lưu email**. Địa chỉ là `info@` (từ v1.0.4: cả `booking@`) thì Desk báo "Đây là hộp thư chung của cơ sở…" sau bước này; mật khẩu và mã không bị tính là sai.
5. Desk báo "Đã lưu email của {tên}. Thông báo đã gửi tới địa chỉ này và các chủ đầu tư." (lần đầu) hoặc "Đã lưu email của {tên}. Thông báo đã gửi tới địa chỉ mới, địa chỉ cũ và các chủ đầu tư." (khi đổi). Nhờ người đó mở hộp thư trên máy hoặc điện thoại riêng, xem đã có thư **Security notice** chưa. Anh/chị cũng nhận một bản: đọc theo bảng **Thư nào – làm gì** (mục 1.6a).

[ẢNH: C1-22-Hộp Sửa email của nhân viên]

- Xóa email của một người: mở hộp như bước 3, bấm **Xóa email**, xác nhận như bước 4.
- Dòng của chính anh/chị không có nút: "Đổi email của bạn ở Bảo mật tài khoản." (mục 1.6a).
- Dòng của chủ đầu tư khác không có nút: "Mỗi chủ đầu tư tự đặt email của mình."
- Quản lý không thấy cột **Email** và không đặt email cho người khác. Quản lý tự nhập email của mình ở mục 1.6a.
- Lễ tân trưởng: email không bắt buộc, nhưng **khuyến khích** thêm (vai này có quyền duyệt trong hạn mức, nhận phòng ngoại lệ).

**Đặt lại xác thực 2 bước** (có từ v1.0.4, chỉ chủ đầu tư, trên máy riêng). Dùng khi một người **đã bật 2 bước** mà mất cả điện thoại (hoặc ứng dụng xác thực) lẫn mã khôi phục. Người đó **giữ tài khoản cũ**: tên đăng nhập, vai, email và lịch sử thao tác không đổi. Người còn mã khôi phục thì tự vào bằng mã (mục 1.7), không cần khối này. Ở v1.0.3 chưa có nút: làm theo dòng **Ở v1.0.3** ở mục 1.7.

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
- "Mật khẩu hoặc mã chưa đúng. Kiểm tra lại rồi nhập mã mới.": hộp vẫn mở, lý do vẫn còn. Chờ ứng dụng hiện mã mới, nhập lại. Sai 5 lần: chờ khoảng 15 phút (mục 1.6a).
- Hộp tự đóng, danh sách tải lại, rồi Desk báo "Đã có người đổi xác thực 2 bước của {tên} trước bạn – hiện không còn bật, nên không cần đặt lại. Danh sách đã được tải lại.": 2 bước của người đó vừa được tắt hoặc đặt lại ở chỗ khác. Không bấm lại.
  - Anh/chị vừa đặt lại ở tab hay máy khác: người đó làm tiếp như phần **Người đó làm tiếp**.
  - Không phải anh/chị: coi như người cầm điện thoại bị mất đã vào tài khoản và tự tắt 2 bước. **Đặt lại mật khẩu ngay** (**Khác… → Đặt lại mật khẩu**, mật khẩu tạm đưa tận tay), rồi người đó làm tiếp như phần **Người đó làm tiếp**.

**Ngay khi đặt lại, Desk tự làm:**
- Đăng xuất người đó **trên mọi máy**, kể cả điện thoại bị mất (Desk và app nhân viên).
- **Mã khôi phục cũ** và mục OTTIMO trong ứng dụng xác thực cũ **hết hiệu lực**. 2 bước của người đó **tắt** tới khi bật lại.
- **Mật khẩu giữ nguyên.** **Đặt lại mật khẩu luôn** (**Khác… → Đặt lại mật khẩu**, đưa mật khẩu tạm tận tay) khi điện thoại bị lấy cắp, khi mật khẩu Desk có lưu hay ghi trên điện thoại đó (trình duyệt tự điền, ghi chú, giấy để cùng điện thoại), hoặc khi không chắc. Mỗi lần xác nhận cần một mã 6 số mới.
- Gửi thư **OTTIMO – Security notice: 2-step verification was reset** / Thông báo bảo mật: xác thực 2 bước đã được đặt lại tới email nhận thông báo của người đó (nếu có) và **mọi chủ đầu tư**, kể cả anh/chị. Thư này anh/chị biết trước: không cần làm gì (mục 1.6a). Chuông **Thông báo** của app nhân viên có dòng "Xác thực 2 bước của bạn đã được đặt lại" (người đó) và "Xác thực 2 bước của một tài khoản khác đã được đặt lại" (chủ đầu tư).
- Ghi **nhật ký bảo mật**: ai đặt lại, cho ai, lúc nào, lý do. Desk v1.0 chưa có màn xem nhật ký này. Cần tra thì nhắn Điều phối viên tên đăng nhập của người đó, không kèm lý do.

**Người đó làm tiếp, ngay lúc ngồi cùng anh/chị:**
1. Đăng nhập Desk trên laptop riêng bằng tên đăng nhập và mật khẩu của mình (vừa **Đặt lại mật khẩu** thì đổi mật khẩu tạm trước).
2. **Vai quản lý (kể cả người trực):** Desk tự mở **Bật xác thực 2 bước**. Làm lại mục 1.3 trên điện thoại mới, cất 10 mã khôi phục mới. Chưa xong thì Desk chưa cho làm việc khác.
3. **Lễ tân trưởng:** Desk không tự mở. Vào **tên của mình → Bảo mật tài khoản**, khối **Xác thực 2 bước** → **Bật ngay**, làm như mục 1.3 (bắt buộc – mặc định đội chọn, bước 8 ở trên; anh/chị đổi được). Anh/chị nhìn tận mắt khối **Xác thực 2 bước** đã bật rồi mới giao việc.
4. **Sale nội bộ, CTV:** đăng nhập bằng mật khẩu, Desk không hỏi mã. **Nên bật lại ngay buổi đó** như bước 3 (không bắt buộc), khi người đó có điện thoại riêng và cất được 10 mã khôi phục.
5. **Buồng phòng, bảo trì:** tùy chọn. Không bật lại thì tài khoản chỉ có mật khẩu, như trước khi bật; Desk và app không hỏi mã. Bật lại như bước 3 chỉ khi người đó muốn, có điện thoại riêng và giữ được mã khôi phục.
6. App nhân viên: người vừa bật lại đăng nhập app sau khi bật xong, app hỏi mã 6 số mới. Người không bật lại đăng nhập app bằng mật khẩu (mục 1.8).

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
| Sáng, cùng lượt kiểm bảo mật (tới v1.0.3) | Xem lại các dòng có chữ "giữ chỗ" trong sổ giao ca và các yêu cầu hoàn mới; **duyệt và chi các khoản hoàn người trực tạo** (mục 15.2). Khoản đã hẹn khách: hoàn muộn nhất 24 giờ sau khi khách nhận phòng; Desk báo khoản thu chưa đối soát thì đối soát cọc cũ ở **Chờ đối soát** trước. Xem lại các khoản miễn/giảm người trực làm bằng quyền quản lý | Sổ giao ca, **Cần duyệt**, **Nhật ký tiền → Hoàn tiền** |
| Trước 09:00 | Đối soát khoản chuyển khoản lễ tân ghi ban đêm | **Nhật ký tiền → Chờ đối soát** (mục 8.2) |
| 07:00–22:00 | Trả lời lễ tân hỏi tiền chuyển khoản đã về chưa, **đúng mã đơn và số tiền** | Điện thoại (mục 8.5) |
| Trong ngày | Duyệt yêu cầu miễn/giảm, hoàn tiền, xóa công nợ | **Cần duyệt** (mục 4) |
| Trong 24 giờ sau mỗi lần trả muộn quá 18:00 | Xem lại phụ thu bằng giá 1 đêm | **Tổng quan → Cần chú ý** (mục 5) |
| Khi người trực hỏi (từ v1.0.2) | Khách thuê tháng rời trước hạn HĐ: xác nhận nhánh ký quỹ trước khi người trực báo khách | Điện thoại, sổ giao ca (mục 7.3) |
| Mỗi ngày | Đối chiếu chuyển khoản với sao kê | **Nhật ký tiền → Chờ đối soát** |
| Cuối ngày (3 ngày đầu: 22:00 cùng lễ tân, qua điện thoại được) | Đối chiếu tiền trong ngày với sổ giấy và két; nhận tiền vượt quỹ lẻ, ký sổ | **Nhật ký tiền** (mục 11) |
| Trong 24 giờ sau mỗi lần xóa yêu cầu website theo yêu cầu người gửi (từ v1.0.1; quản lý, dự phòng chủ đầu tư) | Xóa luồng tin của mã đó trong Google Chat, ghi sổ xóa Chat | Google Chat (mục 12.2) |
| Mỗi tháng (từ v1.0.1; chủ đầu tư) | Rà thành viên phòng "OTTIMO – Yêu cầu đặt phòng"; đối chiếu sổ xóa Chat | Google Chat, **Yêu cầu từ website** (mục 12.1, 12.2) |
| Khi nhận tin **FAIL** ở phòng "OTTIMO – Báo động" (chủ đầu tư) | Mở thử Desk, báo đội | Mục 17.1 |

### 2.2 Kiểm bảo mật mỗi sáng

> **Tạm – kiểm mỗi sáng, tới khi đội bảo mật báo bỏ** (đội báo qua điều phối viên). Trước v1.0.3, thư báo đổi tài khoản nhận tiền, dùng mã khôi phục, đặt lại 2 bước **chưa gửi tới ai**. Từ v1.0.3 thư gửi tới email nhập ở mục 1.6a, nhưng **vẫn kiểm** cho tới khi đội xác nhận đường gửi thư ổn định: v1.0.3 lên, hay thấy thư đầu tiên, **chưa** phải lúc bỏ. Ngày v1.0.3 lên: làm theo mục 15.1. Mỗi sáng trước 09:00:
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
| Nhận phòng khi buồng chưa sẵn sàng (chỉ căn `VD`, `CL`; căn có khách `OC`, `OD`: từ chối) | Lễ tân | Lễ tân trưởng trở lên |
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

**Đơn có hơn một yêu cầu hoàn.** Một đơn có thể có hai yêu cầu hoàn trở lên, ví dụ một từ **Trả sớm** và một từ **Trả phòng** (tiền đã thu cho đêm được FOC sau đó). Đó là các khoản khác nhau, không phải hoàn trùng. Trước khi **Từ chối** một yêu cầu hoàn:
1. Cộng các yêu cầu hoàn **còn mở** của cùng mã đơn ở **Nhật ký tiền → Hoàn tiền** (tìm theo mã đơn). Tab này hiện cả yêu cầu **Chờ duyệt** và yêu cầu **Đã duyệt** chưa chi xong; yêu cầu đã duyệt không còn ở **Cần duyệt**. Dòng có "Đã ghi hoàn …" thì chỉ cộng phần chưa chi. Khoản đã chi xong không cộng.
2. Lấy số Desk còn nợ khách: dòng **Hoàn lại khách … đ** trên **Phiếu thanh toán** (khung đơn → **Xem Phiếu thanh toán**). Desk đã trừ các dòng **Đã hoàn …** và phần OTA giữ. Không tự lấy **Đã thu** trừ **Tổng cộng**: **Đã thu** là tổng đã thu, chưa trừ khoản đã hoàn. Phiếu không có dòng **Hoàn lại khách** thì số ở bước này là 0.
   - Ví dụ: **Trả sớm** 400.000 đã chi tiền mặt lúc trả phòng, còn chờ 800.000 (đêm FOC). Phiếu ghi **Đã hoàn 400.000 đ (Tiền mặt)**, **Hoàn lại khách 800.000 đ** → tổng còn mở 800.000 **bằng** → duyệt.
   - Đơn **chưa trả phòng** thì chưa có Phiếu. Lúc này thường chỉ có một yêu cầu (**Trả sớm**): duyệt bình thường, Desk không cho chi quá số khách trả thừa. Nên chi sau khi khách trả phòng, vì bill cuối có thể thêm minibar hoặc phụ thu.
3. Tổng ở bước 1 **bằng** số ở bước 2: **không có hoàn trùng**. Không từ chối chỉ vì đơn có hai yêu cầu: từ chối nhầm thì khách mất tiền. Vẫn đọc lý do từng yêu cầu như mọi yêu cầu hoàn (FOC đã duyệt, trả sớm, cọc lớn hơn bill). Lý do không khớp folio thì hỏi người tạo trước khi duyệt.
4. Tổng **lớn hơn** số ở bước 2 (thường vì có phát sinh mới sau khi tạo yêu cầu, ví dụ minibar lúc trả phòng): không từ chối, bấm **Duyệt** từng yêu cầu. Desk không cho duyệt quá số còn nợ khách: yêu cầu vượt thì Desk báo "Yêu cầu không còn cần duyệt nên đã tự đóng." và tự tạo **yêu cầu thay thế** đúng số còn lại.
   - Desk có thể đóng **cả các yêu cầu khác đang chờ** của đơn và gộp thành **một** yêu cầu thay thế. Riêng phần **đã duyệt chưa chi** đã vượt số còn nợ khách thì Desk đóng cả yêu cầu **đã duyệt** (mới nhất trước) và **xóa nơi nhận đã nhập** của yêu cầu đó (từ v1.0.4: nơi nhận chuyển sang yêu cầu thay thế, xem gạch **Trước khi duyệt yêu cầu thay thế**). Duyệt theo thứ tự nào thì số tiền cuối vẫn đúng.
   - **Nhận ra yêu cầu thay thế**: hàng **Cần duyệt** và **Hoàn tiền** không ghi lý do; người gửi thường là người tạo yêu cầu cũ, giờ gửi là lúc Desk tự đóng yêu cầu cũ. Mở **Nhật ký tiền → Nhật ký thao tác tiền**, tìm mã đơn: có cặp dòng **cùng phút**, **Đã tự đóng** (số cũ, "Yêu cầu không còn cần duyệt nên đã tự đóng.") rồi **Gửi yêu cầu duyệt** (số mới). Cột lý do của dòng sau có thể hiện mã `overpayment` (lỗi chữ đã biết, sửa ở v1.0.4, mục 15.6). Cột người làm thường ghi người bấm **Duyệt**, hoặc người vừa sửa folio, không phải người tạo. Đó là yêu cầu thay thế, không phải yêu cầu lạ. Desk cũng tự đóng khi có người sửa folio đã chốt: khi đó người gửi yêu cầu thay thế có thể là người vừa sửa. Người gửi là chính anh/chị (vừa sửa folio) thì người khác duyệt (hiện là chủ đầu tư).
   - Yêu cầu **đã duyệt** đang chờ chi mà không còn ở **Hoàn tiền** (Nhật ký thao tác tiền có dòng **Đã tự đóng** cho số đó): không chi theo số cũ; tìm yêu cầu thay thế của cùng mã đơn, làm như gạch dưới.
   - **Trước khi duyệt yêu cầu thay thế**: **Nhật ký tiền → Hoàn tiền** → dòng của mã đơn → kiểm **Cách hoàn** của **yêu cầu mới**. Ở v1.0.3, yêu cầu thay thế **không mang nơi nhận** của yêu cầu cũ, nên thường hiện "—" và nút **Nhập nơi nhận hoàn**. **Áp dụng từ v1.0.4** (khi chủ đầu tư báo v1.0.4 đã lên; tới lúc đó làm như câu trước): yêu cầu thay thế **giữ nơi nhận** (**Cách hoàn**) của yêu cầu bị đóng, nếu các yêu cầu cũ chỉ có **một** nơi nhận, do **một** người nhập. Yêu cầu cũ **không có** nơi nhận thì không tính: một yêu cầu có nơi nhận, một yêu cầu trống thì yêu cầu mới vẫn giữ nơi nhận đó. Vẫn **kiểm Cách hoàn** của yêu cầu mới và đối chiếu với nơi nhận khách đã đưa trước khi duyệt. Người đã nhập nơi nhận ở yêu cầu cũ vẫn **không** duyệt được yêu cầu mới, **trừ chủ đầu tư với khoản chuyển khoản** (như cũ: chủ đầu tư tự nhập chuyển khoản rồi vẫn duyệt và chi được). Các yêu cầu cũ có **2 nơi nhận khác nhau**, hoặc nơi nhận do **2 người khác nhau** nhập: yêu cầu mới **không có** nơi nhận (—), phải **Nhập nơi nhận hoàn** lại. Dòng ghi "Cách hoàn: …" thì đối chiếu với nơi nhận khách đã đưa. Dòng không có cách hoàn (—) thì **Nhập nơi nhận hoàn** trước (mục 8.3), trên máy đã cấp quyền: chuyển khoản thì chủ đầu tư tự nhập rồi vẫn duyệt và chi được; tiền mặt thì người tạo yêu cầu cũ nhập (người nhập nơi nhận tiền mặt không duyệt được khoản đó). Từ v1.0.4 thêm:
     - **Duyệt không mang sang.** Yêu cầu cũ đã duyệt (chưa chi) bị đóng thì yêu cầu thay thế ở **Chờ duyệt**: duyệt lại như mọi yêu cầu. Đây không phải lỗi.
     - Yêu cầu thay thế **tạo trước ngày v1.0.4 lên** vẫn trống (—): không ai chép lại. Nhập nơi nhận như cách ở v1.0.3.
     - **Nhật ký thao tác tiền** có dòng mới **Chép nơi nhận hoàn sang yêu cầu thay thế**, cùng phút với cặp dòng **Đã tự đóng** – **Gửi yêu cầu duyệt**. Dòng này là việc Desk tự làm, không phải ai sửa nơi nhận.
     - **Cách hoàn mang sang không còn hợp**: ví dụ **Tiền mặt** mà khách đã về (chi sau trả phòng), hoặc khách báo đổi tài khoản. Không duyệt. Liên hệ khách 1–1 lấy nơi nhận mới. Ở dòng của yêu cầu mới bấm **Nhập nơi nhận hoàn** (nút vẫn hiện khi dòng đã có nơi nhận), chọn lại **Cách hoàn**, bấm **Lưu** (mục 8.3). Người vừa lưu là người nhập: người đó không duyệt được khoản này, trừ chủ đầu tư với chuyển khoản.
   - Nhập hoặc đổi nơi nhận **sau khi đã duyệt** thì Desk đưa yêu cầu về **Chờ duyệt**, phải duyệt lại.
   - Khách đã về, chưa có số tài khoản: nhắn khách 1–1 từ tài khoản của OTTIMO. Không ghi số tài khoản vào sổ giao ca hay nhóm chat.
   - Duyệt xong, cộng lại theo bước 1–2.
5. Desk không tự đóng như bước 4 mà tổng đã duyệt vượt số ở bước 2, hoặc không rõ một yêu cầu từ đâu: **dừng**, không duyệt, không chi. Ghi sổ giao ca mã đơn và các số, báo chủ đầu tư và đội kỹ thuật. Các nguồn Desk tự ghi là hợp lệ: **Trả sớm**, **Trả phòng** (lý do lễ tân ghi), hủy đơn có cọc, "Tự sinh từ khoản thu …", "Tự sinh từ A32 …", yêu cầu thay thế sau khi tự đóng (nhận ra theo cặp dòng **Đã tự đóng** – **Gửi yêu cầu duyệt** cùng phút ở Nhật ký thao tác tiền, bước 4). Ngoài các nguồn này mới là "không rõ từ đâu".
6. Tổng **nhỏ hơn** số ở bước 2, và khung đơn hiện "Khách đã trả phòng và còn dư …": gửi **Đề nghị hoàn …** cho phần đó (mục 7.1). Khung đơn không hiện dòng này thì tính lại theo bước 1–2. Vẫn lệch thì làm như bước 5, không tạo yêu cầu bằng cách khác.

**Đơn HĐ thuê tháng** (đơn dài hạn nhập tay): không hoàn theo khối này. Đơn HĐ có yêu cầu hoàn hoặc hiện "còn dư": không duyệt, không gửi **Đề nghị hoàn**; đối chiếu HĐ giấy và sổ kế toán, quản lý hỏi chủ đầu tư. Tiền thuê và ký quỹ xử lý ngoài app (mục 7.3 phần đơn HĐ thuê tháng).

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

### 7.3 Khách trả phòng sớm (từ v1.0.2)

**Áp dụng từ khi bản v1.0.2 đã lên.** Lễ tân dùng nút **Trả sớm** trên khung đơn đang ở (tệp 02 mục 11.5). Anh/chị **không giảm tiền phòng trên folio bằng tay nữa**: cách tạm cũ bỏ.

**Đơn ngắn ngày** – Desk tính và ghi:
- Chính sách: đơn Trực tiếp/CTV báo trước từ 1 ngày hoàn 50 % tiền phòng các đêm chưa ở (phụ thu người các đêm đó hoàn 100 %); báo trong ngày rời không hoàn; đơn OTA theo kênh (lễ tân nhập **Số OTA giữ lại** theo extranet). Các đêm đã ở không tính lại mức giảm theo số đêm.
- Desk ghi dòng "Phí trả phòng sớm" vào folio (doanh thu khác, không tính hoa hồng) và tạo **một** yêu cầu hoàn cho phần trả sớm. Anh/chị duyệt ở **Cần duyệt** (khác người tạo) rồi chi (mục 8.3).
- Trả phòng sau đó **không tạo lại** khoản này. Folio còn tiền khách trả thừa **khác** (ví dụ đêm đã thu rồi được FOC): bước **Bill & thu tiền** hỏi lễ tân cách xử lý đúng phần đó; chọn hoàn thì đơn có **thêm một** đề nghị hoàn, không trùng. Trước khi từ chối yêu cầu nào, đối chiếu theo mục 4 (**Đơn có hơn một yêu cầu hoàn**). Yêu cầu **Trả sớm** duyệt được lúc khách còn ở; nên chi sau khi khách trả phòng, vì bill cuối có thể thêm minibar hoặc phụ thu (mục 4 bước 2). Phiếu ghi "Phí trả phòng sớm (báo trước N ngày)"; phần OTA giữ lại chỉ ghi "Phí trả phòng sớm".
- **Áp dụng từ v1.0.4:** ở **Trả phòng**, dưới **Còn phải thu**, Desk hiện "Đang chờ hoàn cho khách {số tiền} (yêu cầu từ Trả sớm)." Lễ tân và lễ tân trưởng chỉ thấy yêu cầu hoàn chờ duyệt do chính mình tạo (giới hạn đã biết; v1.0.5 hiện **tổng số đang chờ hoàn** ở trang **Trả phòng** và folio, tab **Hoàn tiền** giữ phạm vi như hiện nay), nên sẽ hỏi anh/chị khi người khác (ví dụ ca trước) bấm **Trả sớm**. Anh/chị thấy đủ ở **Cần duyệt** và **Nhật ký tiền → Hoàn tiền** (dòng của mã đơn): báo lễ tân số còn hoàn trước khi lễ tân báo khách.
- Ví dụ: đơn căn 202 từ 9/11 đến 16/11, 5.205.000 đ; ngày 12/11 khách báo rời 14/11 → hai đêm bỏ 1.533.000 đ → hoàn **767.000 đ**, phí **766.000 đ**.

**Đơn HĐ thuê tháng** (đơn dài hạn nhập tay, khách rời trước ngày kết thúc ghi trên HĐ giấy) – **anh/chị quyết nhánh trước khi lễ tân báo khách.** Desk không biết tiền thuê tới hết HĐ đã thu chưa nên chỉ hiện câu kiểm và hai nhánh, không tính tiền. Lễ tân gửi: mã đơn, ngày kết thúc HĐ, ngày rời, kỳ cuối đã thu chưa, nhánh đề xuất. Hiện OTTIMO một người trực: người trực hỏi **chủ đầu tư**.

Tháng lịch cuối của HĐ = tháng chứa ngày kết thúc HĐ (HĐ kết thúc ngày 01 thì là tháng liền trước). Kỳ cuối = tiền thuê + phí dịch vụ tháng đó, hạn ngày 05.

| Khách rời | Kỳ cuối | Nhánh |
|---|---|---|
| Trong tháng lịch cuối | Đã thu | **Đã thu đủ** – không vi phạm HĐ (ESC-048) |
| Trong tháng lịch cuối, trước ngày 05 | Chưa tới hạn | Thu kỳ cuối khi khách rời, rồi áp **Đã thu đủ** |
| Trong tháng lịch cuối, sau ngày 05 | Quá hạn, chưa thu | Anh/chị quyết theo HĐ |
| Trước khi tháng lịch cuối bắt đầu | – | **Chưa thu đủ** – vi phạm HĐ. Khách xin trả trước các tháng chưa tới để giữ ký quỹ: **không nhận**, anh/chị trả lời khách |

| | **Đã thu đủ** | **Chưa thu đủ** |
|---|---|---|
| Ký quỹ | Quyết toán như trả phòng đúng hạn HĐ: trừ điện nước kỳ cuối, dọn lẻ, minibar chưa thu, hư hỏng, phí phạt; còn dư **hoàn trong 7 ngày làm việc**; thiếu thì thu thêm | **Mất toàn bộ ký quỹ**, dù báo trước bao nhiêu ngày. Không truy thu giảm giá kỳ hạn |
| Điện nước, dọn lẻ, hư hỏng còn nợ | Trừ vào ký quỹ | Thu thêm, không trừ vào ký quỹ |
| Tiền thuê, phí dịch vụ | Không hoàn các ngày không ở | Đã thu cho tháng lịch **chưa bắt đầu**: hoàn. Tháng đang ở không hoàn |

- Mọi khoản trên làm **ngoài app** (ký quỹ, tiền thuê không có trong Desk). Anh/chị duyệt và chi khoản hoàn ký quỹ, tiền tháng chưa bắt đầu; ghi sổ kế toán.
- Trước khi trừ hư hỏng vào ký quỹ: phải có **biên bản kiểm phòng có ảnh trong ngày rời** và **ảnh công tơ điện chốt ngày rời**.
- Ví dụ: HĐ 3 tháng 20/11/2026 → 20/02/2027, ký quỹ 8.500.000. Rời 15/02 đã thu kỳ 05/02 → hoàn 8.500.000 − điện nước 01–15/02 (giả sử 600.000) = **7.900.000** trong 7 ngày làm việc, không hoàn 16–19/02. Rời 03/02 → thu kỳ cuối 5.387.000 + 127.000 rồi quyết toán như trên. Rời 25/01 → mất 8.500.000.
- Khách đã ở hết HĐ, đang ở phần gia hạn rồi rời sớm: ký quỹ theo nhánh **Đã thu đủ**; các ngày gia hạn chưa ở như đơn ngắn ngày Trực tiếp (báo trước từ 1 ngày hoàn 50 %, trong ngày rời không hoàn), làm ngoài app, anh/chị duyệt.

**Giới hạn tới v1.0.3 với đơn HĐ (sửa ở v1.0.4):** Desk dời **Ngày ra (theo HĐ)** khi gia hạn và không giữ ngày kết thúc HĐ (lễ tân ghi ngày này vào bảng kỳ thu và sổ giao ca trước khi gia hạn); khách rời trong phần gia hạn vẫn thấy khung "Trả trước hạn hợp đồng thuê tháng"; nhật ký đơn HĐ có thể ghi "BR-428 notice …" – bỏ qua, xem nhánh và người quyết trong sổ giao ca. **Từ v1.0.4** (khi chủ đầu tư báo v1.0.4 đã lên): Desk giữ ngày kết thúc HĐ khi gia hạn; **Trả sớm** chỉ hiện khung HĐ khi khách rời trước ngày kết thúc HĐ; nhật ký ghi "BR-313 lease early end – deposit per lease". Lễ tân không cần ghi ngày này vào sổ giao ca trước khi gia hạn; bảng kỳ thu vẫn giữ cột ngày kết thúc HĐ.

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

> **Lỗi nhỏ đã biết (sửa ở v1.0.4):** cột lý do có thể hiện **mã lý do thô** (chữ tiếng Anh nối bằng gạch dưới). Đọc phần lý do người làm tự ghi, bỏ qua mã.

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

### 8.4 Hoàn cọc cho khách giữ chỗ quá hạn (tới v1.0.3)

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

> **Có từ v1.0.2:** **Danh mục căn** → mở căn: danh sách giá đêm/giá tháng đã lên lịch cho các ngày sau (chủ đầu tư và quản lý thấy, lễ tân không thấy). Hủy được một dòng chưa tới ngày hiệu lực; không hủy được dòng đang áp dụng hay dòng giá duy nhất của căn. Không hủy dòng giá đầu tiên của căn mới (lỗi BUG-R4-015, sửa ở v1.0.3). Bỏ việc ghi sổ mỗi lần lên lịch giá.
>
> **Tạm ở v1.0 (tới khi v1.0.2 lên):** Desk chưa hiện danh sách giá đã lên lịch và chưa có nút hủy. Mỗi lần lên lịch giá cho ngày sau, ghi **căn, giá, ngày hiệu lực** vào sổ. Muốn bỏ một giá đã lên lịch: nhập lại giá hiện hành với **đúng ngày hiệu lực** đó.

**Ngừng bán một căn** (ví dụ chủ đầu tư dùng riêng dài ngày): trong **Sửa**, tắt **Đang bán**. Căn không hiện trong form đặt phòng; sơ đồ phòng ghi **Ngừng bán**. Đơn đã có giữ nguyên. Hỏng hóc thì dùng **khóa phòng** (tệp 04), không dùng ngừng bán.

**Định mức và tối đa**: trong **Sửa**, mục **Số người**. **Tối đa** chỉ bằng định mức hoặc định mức + 1 (người thứ thêm ngủ sofa). Không tính trẻ dưới 6 tuổi.

### 9.1a Giá ước tính trên website (khi gói LP-v2 phát hành)

**Áp dụng khi gói website LP-v2 đã lên.** Form đặt phòng trên ottimo.vn hiện **giá ước tính** cho khách sau khi khách chọn hạng phòng, ngày, số khách.
- **Một nguồn giá:** web dùng chính **Giá đêm niêm yết**, lịch ngày đặc biệt và phụ thu người trên Desk, kênh Trực tiếp. Anh/chị đổi giá ở mục 9.1 thì web dùng giá mới trong khoảng **10 phút**, không cần sửa website. Không ai gõ giá vào website.
- **Theo hạng:** web tính theo **Hạng phòng công khai** của từng căn (trong **Sửa** căn; chỉ chủ đầu tư đổi). Căn chưa gán hạng: web ghi "giá theo yêu cầu" cho căn đó.
- Chỉ ngắn ngày **1–29 đêm**. Theo tháng hoặc từ 30 đêm: web **không hiện số** (anh/chị chốt 01/11), chỉ mời khách nhận báo giá riêng.
- Con số luôn đi kèm: ước tính, đã gồm thuế, cho số khách đã chọn, chưa giữ phòng; giá cuối và phòng trống nằm trong báo giá. Thân trang vẫn không ghi giá.
- **Bật, tắt:** tham số `public_show_prices` ở **Tham số quy tắc** (mục 9.2), chỉ chủ đầu tư. Mặc định tắt; bật sau khi đội kiểm giá web khớp giá Desk. Cần tắt gấp (ví dụ giá vừa nhập nhầm): đặt `false`, khoảng 2 phút sau web hết hiện giá; form vẫn nhận yêu cầu.
- **Trên Desk:** mỗi yêu cầu có dòng **Giá ước tính khách đã thấy**. Khi lễ tân lập báo giá mà giá Desk khác số khách đã thấy, hộp báo giá hiện cảnh báo **"Khác giá web khách đã thấy: {cũ} → {mới}"** (giá theo lịch giá hôm nay khác số khách thấy trên web) để lễ tân giải thích với khách (tệp 02 mục 13.1c). Lễ tân không hứa giữ số cũ; khách xin giữ thì người trực báo anh/chị hoặc quản lý quyết.

**Đếm khách theo ngôn ngữ** (khi trang tiếng Hàn, Trung, Nga đã lên): **Yêu cầu từ website** → lọc theo **Ngôn ngữ**, kết hợp lọc trạng thái (gồm cả đã thành đơn, đã đóng) → Desk hiện tổng số yêu cầu khớp lọc. Số chỉ gồm yêu cầu còn trên Desk. Báo cáo, xuất dữ liệu theo ngôn ngữ: dự kiến v1.2. Cách lễ tân trả lời khách tiếng Hàn, Trung, Nga (tiếng Anh, được dùng Google Dịch trên mọi màn hình Desk theo quyết định của anh/chị ngày 01/11): tệp 02 mục 13.1d.

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
- **Form "Yêu cầu đặt phòng" trên website**: công tắc ở nhóm **Khác**, dòng `public_booking_requests_enabled` (chưa có tên tiếng Việt), giá trị `false` là tắt. Chỉ chủ đầu tư bật, tắt. Form **đã bật từ chiều 30/10**.
- **`privacy_notice_version`** (nhóm **Khác**, chưa có tên tiếng Việt, chỉ chủ đầu tư): **không** đổi lúc khác. Từ v1.0.4 chỉ đổi một lần, đúng ngày thay tờ **Your ID details** v2, sau tin "Đã thay tờ v2" của người trực. Trước mọi lần Lưu, gọi người trực xác nhận tờ v2 còn trên quầy, Lưu trong lúc còn gọi (`00-index.md` mục 4). Đã Lưu thì trong ngày không quay về v1 được.
- Đổi tham số làm số trên Desk khác số lễ tân đã học: báo người trực.

> **Lỗi đang sửa – Wi-Fi (sửa ở v1.0.3 hoặc v1.0.4):** Desk chưa có chỗ nhập Wi-Fi của cơ sở, nên trang khách chưa hiện Wi-Fi (trang ghi "hỏi lễ tân"). Tới khi sửa xong: khách xem **thẻ Wi-Fi trong căn**; lễ tân đọc khi khách hỏi.

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

> **Lỗi nhỏ đã biết (sửa ở bản vá sau):** câu gợi ý trên màn bảo "tạo một mã VietQR nhỏ và quét thử". Làm theo tệp này: **không tạo mã thử, không chuyển tiền**.

> **Lỗi đang sửa:** ở v1.0 thư báo đổi tài khoản nhận **chưa gửi tới email** của chủ đầu tư. Vì vậy chủ đầu tư kiểm mỗi sáng (mục 2.2), tới khi đội bảo mật báo bỏ. Sửa ở v1.0.3: thư tới email chủ đầu tư nhập ở mục 1.6a, tiêu đề **OTTIMO – Notice: the deposit receiving account was changed / Thông báo: tài khoản nhận cọc đã thay đổi**. Thư này **không có chữ "Security notice"**: đừng lọc thư theo chữ đó. **Từ v1.0.4** tiêu đề đổi thành **OTTIMO – Security notice: receiving account update / Thông báo bảo mật: cập nhật tài khoản nhận chuyển khoản**, gửi cả khi đặt lịch lẫn khi hủy lịch đổi.

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

**Đã có từ 03/11 (v1.0.1).** Mỗi yêu cầu mới trên website được Desk đăng vào phòng **"OTTIMO – Yêu cầu đặt phòng"** ở **mức A**: mã yêu cầu, giờ nhận, hạn phản hồi, mức gấp và link **Mở Desk**. Tin **không có** tên, liên hệ, kênh, lời nhắn, ngày ở, số khách: xem trên Desk. Mức có chi tiết khách (chủ đầu tư chọn ở ESC-041) **chưa bật**: chờ đội kiểm trên phòng Chat thử (ESC-046). Khi bật, chủ đầu tư báo và bộ hướng dẫn cập nhật mục này. Tin trong phòng **không tự xóa** (anh/chị chấp nhận 30/10). Desk vẫn là nguồn chính; người trực vẫn giữ Desk mở 07:00–22:00 (tệp 02 mục 13.1).

Cách người trực dùng phòng và mẫu tin: tệp 02 mục 13.1a.

**Cài đặt phòng và tài khoản (chủ đầu tư làm; giữ đúng mỗi khi thêm người hoặc tạo phòng mới):**
- Phòng chỉ cho tài khoản **@ottimo.vn**; tắt cho người ngoài tổ chức tham gia.
- Thành viên chỉ gồm **chủ đầu tư, quản lý, lễ tân trưởng, lễ tân**. **Không mời** sale nội bộ, CTV, buồng phòng, bảo trì; không tài khoản dùng chung. Mời sale vào thì câu trong thông báo cho khách ("chỉ quản lý và lễ tân") thành sai.
- **Chủ đầu tư và quản lý là quản lý phòng** (space manager). Người trực hiện nay giữ vai quản lý: đặt làm quản lý phòng.
- Trong Admin console: bắt buộc **xác minh 2 bước** cho mọi tài khoản trong phòng; bật **quản lý thiết bị di động cơ bản**, để xóa tài khoản khỏi máy khi mất máy.
- Trong phòng không có ứng dụng hay webhook nào khác ngoài webhook của Desk. Không gửi, không dán đường dẫn webhook vào chat, email, tài liệu.
- Mỗi thành viên cài điện thoại theo bảng dưới **trước khi** được thêm. Anh/chị xem tận mắt.
- Người nghỉ việc: gỡ khỏi phòng theo thứ tự ở mục 1.9, khối **Ngày cuối của người nghỉ** (người bị cho thôi việc: ngay lúc báo, cùng lần **Khóa tài khoản**).
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
| 3 | Quản lý phòng (quản lý; dự phòng chủ đầu tư) | **Trong 24 giờ** từ lúc xóa trên Desk | Trong phòng **"OTTIMO – Yêu cầu đặt phòng"**, tìm theo mã (gõ 8 ký tự sau "REQ-"). Xóa **mọi tin của luồng**: tin đầu, các tin nhắc, tin "Đã xóa dữ liệu…", và **mọi tin nhân viên trả lời**. Tìm lại để chắc không còn |
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
- Phòng Google Chat "OTTIMO – Yêu cầu đặt phòng" đã có từ 03/11 (v1.0.1): xem tận mắt điện thoại từng thành viên đã cài đặt (mục 12.1).
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
| Nhân viên mất điện thoại | Không có 2 bước: **Đặt lại mật khẩu** hoặc **Khóa tài khoản**. Có 2 bước mà mất cả mã khôi phục: gặp tận mặt; từ v1.0.4 **Đặt lại xác thực 2 bước** (mục 1.9), ở v1.0.3 làm theo mục 1.7 |
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

## 15. Tạm thời tới v1.0.3 và các bản sau

Các việc dưới đây làm theo cách tạm từ **02/11** tới khi anh/chị (chủ đầu tư) báo bản có sửa đã lên. Thư bảo mật, giữ chỗ quá hạn, check-in online sửa ở **v1.0.3** (dự kiến 07/11; thư bảo mật chậm nhất 09/11). Các lỗi ở mục 15.6 sửa ở v1.0.3 hoặc bản vá sau. Bản v1.0.1 (đã lên 03/11) chỉ có tin Google Chat, chưa sửa các việc này.

### 15.1 Kiểm bảo mật mỗi sáng trước 09:00

Theo mục 2.2, kể cả ngày nghỉ. **Hết tạm khi đội bảo mật báo bỏ** (qua điều phối viên). v1.0.3 lên, hay thấy thư **Security notice** đầu tiên, **chưa** phải lúc bỏ.

Ngày v1.0.3 lên (mục 1.6a):
1. **Anh/chị (chủ đầu tư) nhập email của mình trước**, thấy thư của mình về hộp thư riêng rồi mới bảo quản lý (và người trực có vai quản lý) nhập.
2. Khi quản lý nhập, anh/chị nhận một thư báo email của quản lý đã đổi. Thư này là bình thường: đây là lần tập đọc thư theo bảng **Thư nào – làm gì**.
3. Thấy thư thì báo đội **"đã nhận"** qua điều phối viên. **Không dán địa chỉ email vào chat.**
4. **Vẫn kiểm mỗi sáng** tới khi đội bảo mật báo bỏ.

### 15.2 Chủ đầu tư duyệt và chi mọi khoản hoàn người trực tạo

- Desk không cho người tạo yêu cầu hoàn tự duyệt, tự chi, kể cả có quyền quản lý. Người trực chỉ hủy và **nhập nơi nhận hoàn**.
- Anh/chị duyệt ở **Cần duyệt**, chi ở **Nhật ký tiền → Hoàn tiền** (mục 8.3, 8.4).
- Khoản đã hẹn khách: hoàn **muộn nhất 24 giờ** sau khi khách nhận phòng.

### 15.3 Rà giữ chỗ và lý do hủy

- Người trực rà giữ chỗ **3 mốc mỗi ngày** (mở quầy muộn nhất 09:00 · 11:00 · đóng quầy muộn nhất 21:00, gồm giữ chỗ hết hạn trước 09:00 sáng mai) vì Desk chưa báo giữ chỗ quá hạn vào **Cần chú ý**, và sau hạn Desk chỉ còn **Hủy giữ chỗ**. Chi tiết ở tệp 02 mục 17.1.
- Desk ghi sai với giữ chỗ có cọc quá hạn ("đơn đã tự hủy", "Không thu phí"): đơn chưa hủy; hủy thì Desk vẫn tạo yêu cầu hoàn đủ số đã nhận.
- Không dùng lý do hủy **Khác (ghi rõ)** (Desk khóa nút hủy). Chọn **Không liên lạc được** hoặc **Khách đổi ý**; lý do thật ghi sổ giao ca.
- Anh/chị xem lại các dòng có chữ "giữ chỗ" trong sổ giao ca cùng lượt kiểm sáng. Báo người trực khi v1.0.3 lên.

### 15.4 Check-in online tạm dừng

- Không tạo, không gửi link check-in online cho khách thật. Mọi khách làm giấy tờ tại quầy, được xem tờ **Your ID details** trước khi đưa giấy tờ.
- Đội kiểm mỗi sáng số link mới tạo trên Desk thật; khác 0 thì đội báo anh/chị mã đơn để đối chiếu với sổ giao ca.
- Anh/chị báo "mở lại check-in online" chỉ khi đội báo bản v1.0.3 đã có thông báo xử lý dữ liệu mới và bảo mật đã kiểm xong.

### 15.5 Khách trả phòng sớm

Từ v1.0.2 làm theo mục 7.3 (nút **Trả sớm**, không giảm tiền trên folio bằng tay). Đơn HĐ thuê tháng: anh/chị xác nhận nhánh ký quỹ trước khi người trực báo khách.

### 15.6 Lỗi đang sửa liên quan tới anh/chị

| Lỗi | Cách tạm |
|---|---|
| Thư báo bảo mật chưa gửi tới chủ đầu tư (sửa ở v1.0.3: nhập email ở mục 1.6a) | Kiểm bảo mật mỗi sáng (mục 2.2) tới khi đội bảo mật báo bỏ |
| Danh sách và nút hủy giá đã lên lịch: có từ v1.0.2 | Tới khi v1.0.2 lên: ghi sổ mỗi lần lên lịch giá (mục 9.1) |
| Chưa nhập được Wi-Fi trên Desk | Thẻ Wi-Fi trong căn |
| Câu gợi ý "tạo mã VietQR nhỏ và quét thử" | Không tạo mã thử (mục 10.1) |
| Folio đã khóa: câu báo ghi "Chỉ quản lý ghi được…" (sai) | Bỏ qua vế đó; không ai sửa được sau 24 giờ |
| **Hoàn tác nhận phòng** bị từ chối khi folio có dòng mới | Bỏ dòng mới và đảo khoản thu trước (mục 7.1) |
| Cột lý do trong Nhật ký tiền hiện mã thô | Đọc phần lý do người làm tự ghi |
| Yêu cầu hoàn thay thế (Desk tạo sau khi tự đóng yêu cầu cũ): hàng **Cần duyệt** và **Hoàn tiền** không ghi lý do; **Nhật ký thao tác tiền** hiện mã `overpayment` ở cột lý do (sửa ở v1.0.4) | Nhận ra theo cặp dòng **Đã tự đóng** – **Gửi yêu cầu duyệt** cùng phút, cùng mã đơn. Kiểm **Cách hoàn** của yêu cầu mới; "—" thì **Nhập nơi nhận hoàn** rồi mới duyệt (mục 4 bước 4) |
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
| +24 giờ từ trả phòng | Hạn xem lại phụ thu bằng giá 1 đêm; hạn điều chỉnh folio; folio khóa |
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
| Quên mật khẩu, mất điện thoại, tài khoản bị khóa (nhân viên) | Nhân viên → chủ đầu tư | **Đặt lại mật khẩu** / **Mở khóa** / **Khóa tài khoản** (mục 1.9). Người có 2 bước mất cả điện thoại lẫn mã khôi phục: gặp tận mặt; từ v1.0.4 **Đặt lại xác thực 2 bước** (mục 1.9), ở v1.0.3 khóa tài khoản cũ, tạo tài khoản mới (mục 1.7) |
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

Quy tắc tách nhiệm hoàn tiền (mục 4) áp lên trên bảng này: người tạo yêu cầu hoàn không tự duyệt, không tự chi. Tới bản sửa (v1.0.3 hoặc v1.0.4), vai chỉ có Bảo trì chưa tạo phiếu, chưa khóa phòng được trên Desk (mục 15.6).

### 18.2 Tập ở đâu, bài tập (2 giờ; kế toán 1 giờ)

- Tập mọi thao tác trên **Desk tập** (dữ liệu giả) bằng **tài khoản tập** đội tạo sẵn. Địa chỉ và tài khoản tập: chủ đầu tư đưa tận tay trong buổi đào tạo. Mật khẩu Desk tập **khác** mật khẩu Desk thật. Tài khoản tập bị khóa sau buổi đào tạo cuối.
- Trên Desk tập: mã VietQR không dùng để chuyển tiền; không nhập giấy tờ, số điện thoại hay tài khoản thật.

Bài tập chủ đầu tư, quản lý:
1. Đăng nhập 2 bước, tạo bộ mã khôi phục mới (trên máy riêng). Chủ đầu tư: làm thử một lượt kiểm bảo mật buổi sáng (mục 2.2); nói được vì sao lưu mật khẩu Desk trong trình quản lý mật khẩu và dừng sau 2 lần gõ sai (mục 1.7).
2. Đổi giá đêm một căn có ngày hiệu lực.
3. Duyệt và từ chối một yêu cầu miễn phí ở **Cần duyệt**.
4. Xem lại một phụ thu trả muộn bằng giá 1 đêm: **Mở folio** → **Đã xem**.
5. Đối soát một khoản ở **Chờ đối soát**.
6. Chủ đầu tư: thêm một người dùng giả, **Đặt lại mật khẩu**, **Mở khóa** tài khoản bị khóa tạm, **Khóa tài khoản**. Từ v1.0.4: **Đặt lại xác thực 2 bước** cho một người dùng giả đã bật 2 bước, rồi cùng người đó bật lại (mục 1.9). Nói được cách làm khi người trực mất cả điện thoại lẫn mã khôi phục (mục 1.7).
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
