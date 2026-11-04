# Hướng dẫn Lễ tân – OTTIMO Desk v1.0

- Dành cho: **lễ tân (FD)**, **lễ tân trưởng (FDL)**, người trực đêm
- Thiết bị: **máy quầy đã được cấp quyền**, địa chỉ `desk.ottimo.vn`. Lễ tân trưởng dùng thêm app nhân viên `staff.ottimo.vn` trên điện thoại để kiểm phòng.
- Áp dụng cho: **OTTIMO Desk v1.0** (bản `v1.0.0`), chạy thật từ **thứ Hai 02/11/2026**. Mục 9.3 bước 6, 11.5 và 17.5 áp dụng từ bản `v1.0.2` (nút **Trả sớm**)
- Lập: BA · 30/10/2026 · Bộ hướng dẫn theo bộ phận, bản 1.11 – 04/11/2026 (gộp sau bản 1.10), **áp dụng từ v1.0.4**: Desk chặn cả `booking@` (mục 1.6); Desk giữ ngày kết thúc HĐ khi gia hạn, **Trả sớm** chọn đúng nhánh (mục 9.3, 11.5, 17.5); dòng **Đang chờ hoàn** ở Trả phòng và giới hạn đã biết khi yêu cầu do người khác tạo (mục 11.1, 11.5.2); Trả sớm lúc 00:00–05:59: đổi **Ngày rời mới** thành ngày lịch hôm nay (áp dụng ngay, giới hạn có từ v1.0.2) – mục 11.5.1, theo DOM; sửa theo review DOM, PO: nút **Trả phòng** chỉ hiện từ 06:00, khách đi trước 06:00 thì làm Trả phòng từ 06:00 (mục 11.5.1, 13.3), câu in đậm "Tới v1.0.3, Desk chỉ chặn được `info@`" (mục 1.6), giới hạn **Đang chờ hoàn** (mục 11.1, 11.5.2), ví dụ HĐ ký lại (mục 17.5); sửa theo DOM lượt 2: khách đi trước 06:00 thì thu ngay bằng tiền mặt hoặc thẻ POS, ghi ở bước Bill lúc 06:00, Desk đòi **Ghi chú giờ trả** (mục 11.5.1); áp dụng ngay tới khi v1.0.4 lên: đơn Nội bộ cần ở thêm thì không bấm Gia hạn mà tạo đơn Nội bộ mới 0 đ, xóa trống ô giá (mục 5.1, 9.3 bước 7, 17.6; BUG-R4-038); sửa theo DOM lượt 3: căn đang có khách (`OC`, `OD`) không xác nhận ngoại lệ nhận phòng (mục 7.4, 16.2), đơn OTA gõ đủ giá mọi đêm (mục 5.3); bổ sung cùng ngày (ARC PR #70 thẻ 03, 05; DOM trả lời ARC-03/UXD-05): giá đã gõ được giữ hay bị xóa khi đổi số khách, ngày, kênh, căn (từ v1.0.4, theo #70); đơn OTA từ v1.0.4 để trống thì lấy giá niêm yết (theo #73); giá thỏa thuận mà khách chưa chuyển cọc: chuyển ngay thì Tạo đơn, phải giữ lâu thì giữ chỗ theo giá niêm yết rồi Điều chỉnh giá đêm khi tiền về (mục 5.1 bước 8, 11); bổ sung 05/11 (UXD, DOM lượt 5): từ v1.0.4 Desk khóa **Giữ chỗ** khi còn giá đã gõ, kèm câu báo (mục 5.1 bước 11); căn `OC`, `OD` hoặc còn đơn khác đang ở: không có ngoại lệ nhận phòng, từ v1.0.4 Desk chặn; thứ tự: trả phòng đơn trước, mời khách chờ hoặc đổi căn, đơn trước đã trả phòng mà căn vẫn có khách thì đổi căn và báo quản lý (mục 7.4, 16); áp dụng ngay tới v1.0.3: cách làm tạm BUG-R4-042 khi trả phòng khách đã đổi căn, 2 tủ minibar (mục 11.1); đơn quá ngày đi vẫn **Đang ở**: Desk không có nút Trả phòng, **Gia hạn** tới hôm nay rồi **Trả phòng**; khách ở thật thì thu đêm thêm như gia hạn, quên bấm thì xin giảm 100 % đêm thêm (DOM lượt 8, BR-421 v0.5.7) (mục 7.4, 11.1, 16.1); đơn Nội bộ gõ giá đủ mọi đêm (có thu) hoặc để trống hết (0 đ), từ v1.0.4 Desk chặn gõ một phần (theo #82); đơn Nội bộ có cả đêm thu và đêm miễn phí: gõ mọi đêm, quản lý hoặc chủ đầu tư sửa đêm miễn phí về 0 ở Folio trước khi nhận phòng, không dùng FOC hay giảm 100 % (DOM, BR-105 v0.5.8, v0.5.9) (mục 5.1 bước 4); trước khi dùng ngoại lệ nhận phòng căn `VD`, `CL`, kiểm căn thật sự trống, nhất là căn có khách đổi phòng hôm nay chưa chuyển xong (SEC FB-R4-SEC-BE-PR74-02) (mục 7.4); bổ sung 05/11 sau khi gộp main: khung chặn nhận phòng ghi mã đơn giữ căn (mục 7.4); 2 tủ minibar từ v1.0.4, cách làm tạm BUG-R4-042 chỉ còn cho v1.0.3 (mục 11.1 bước 2); đơn quá ngày đi (b) trước 12:00 để giờ Desk điền (mục 11.1); đơn Nội bộ: câu Desk khi gõ một phần hoặc gõ 0, lễ tân không sửa được đêm về 0 (mục 5.1 bước 4); từ v1.0.4 cột **Nguồn giá** ghi **Giá đã gõ** ở đêm gõ tay (mục 5.1 bước 8); sửa theo review #72: đêm miễn phí về 0 trước khi nhận phòng, nhận phòng mà chưa về 0 thì chưa thu (mục 5.1 bước 4); minibar căn cũ khi đổi phòng ghi sổ giao ca, không **Thêm phát sinh** (mục 9.4, 11.1 bước 2); ô **Loại** chọn **Giảm giá đặc biệt (tiền phòng)** (mục 9.5, 11.1); đơn quá ngày đi (b): xóa mã cửa ngay, không kéo dài mã, ngày đi trên cổng là ngày khách đi thật (mục 8.3, 9.3, 11.1); mục 7.4 tách theo từng ca, **Lý do** ghi đã kiểm căn (mục 7.4, 14.3); bản 1.10 – 04/11/2026, **áp dụng từ v1.0.4**: mất cả điện thoại lẫn mã khôi phục thì chủ đầu tư gặp tận mặt rồi **Đặt lại xác thực 2 bước**, anh/chị giữ tài khoản cũ (mục 1.7, 1.8; BUG-R4-032; sửa cùng ngày theo review SEC, PO: điện thoại bị lấy cắp hoặc có lưu mật khẩu thì chủ đầu tư đặt lại mật khẩu luôn, bỏ chữ "quy định của OTTIMO" ở 1.8); bản 1.9 – 04/11/2026, **áp dụng từ v1.0.4** (bản đang chạy là v1.0.3; tới khi chủ đầu tư báo v1.0.4 đã lên, làm như cũ): tờ **Your ID details** bản v2 có thêm đoạn về dịch tin nhắn, chân tờ "v2 · 11/2026", khách đọc tiếng Nga dùng tờ A4 EN/RU (mục 7.2); app nhân viên có bước nhập mã 2 bước, đổi mật khẩu tạm ngay trên app, bật 2 bước làm trên Desk (mục 1.8, 17.6); áp dụng ngay: không dùng **Dịch trang** ở màn giấy tờ (mục 13.1d); sửa cùng ngày theo review DOM: ngày thay tờ v2 có giờ, người làm, bước chờ, mở quầy kiểm chữ v2 (mục 2, 7.2, 18); sửa theo DOM lượt 2 và SEC: mốc, tờ v1 trên máy tính bảng giữ tới khi có tin, F5 và Desk báo lỗi ở Khối 1, nhắn "Đặt lại v1" trước, tin đi chéo (mục 7.2); sửa theo DOM lượt 3 và SEC: mở quầy kiểm chữ v2 chỉ từ hôm sau ngày sổ giao ca có dòng thay tờ, "Đã Lưu", tờ v2 cất khỏi quầy, khách không muốn dịch (mục 2, 7.2, 13.1d, 18); yêu cầu hoàn thay thế và đổi nơi nhận (11.5.2, 12.2); từ v1.0.4 lễ tân trưởng bắt buộc 2 bước, người trực kiểm căn trên app, 13.2a là dự phòng (1.8, 2, 13.2, 13.2a, 14.2, 18, 20.3); bản 1.8 – 04/11/2026, áp dụng ngay: sửa câu "trả phòng sau đó không tạo thêm" yêu cầu hoàn – trả phòng không tạo lại khoản Trả sớm, tiền trả thừa khác thì bước Bill hỏi và có thể thêm một đề nghị hoàn; lỗi chữ Desk ở hộp Trả sớm (mục 11.1 bước 6, 11.5.2); sửa cùng ngày theo review DOM: nhập nơi nhận ngay khi khách còn ở quầy, báo khách hai lần chuyển, đơn HĐ thuê tháng không chọn hoàn, yêu cầu Trả sớm bị thay thế thì kiểm lại nơi nhận; sửa cùng ngày theo QA đọc staging: yêu cầu thay thế không ghi lý do "trả thừa", nhận ra theo số mới cùng mã đơn, không mang nơi nhận, có thể thay cả yêu cầu đã duyệt chưa chi, mã `overpayment` là lỗi chữ BUG-R4-026 (mục 11.5.2); bản 1.7 – 03/11/2026, áp dụng cùng 1.6 khi v1.0.3 lên: sửa email nhận thông báo bảo mật theo review DOM và ARC – email riêng chỉ mình đọc, Desk chỉ chặn `info@`, không mở hộp thư riêng trên máy quầy, câu báo sai mật khẩu và khóa 5 lần, mọi thư báo về việc mình không làm, lễ tân trưởng khuyến khích có email và không bật 2 bước ở v1.0.x (mục 1.3, 1.5, 1.6, 1.8); bản 1.6 – 04/11/2026: thêm trang **Bảo mật tài khoản** và email nhận thông báo bảo mật của v1.0.3 (mục 1.3, 1.6); bản 1.5 – 03/11/2026: viết lại mục 11.5 khách trả phòng sớm theo nút **Trả sớm** của v1.0.2, hai nhánh ngắn ngày và HĐ thuê tháng (ESC-048), ghi ngày kết thúc HĐ trước khi gia hạn đơn HĐ (9.3), giới hạn tới v1.0.3 (17.5); bản 1.4 ngày 01/11 sửa chữ cảnh báo chênh giá và câu ghi chú khách tiếng Nga (bản trước: 1.3 (tách từ Sổ tay sử dụng OTTIMO Desk v1.0, bản nội dung 1.5; sửa theo review DOM, SEC, UXD, QA ngày 30/10; thêm phòng Google Chat và xóa theo yêu cầu người gửi theo SEC, ESC-041, ESC-042; bản 1.3 ngày 01/11 thêm giá ước tính trên website và khách viết bằng tiếng Hàn, Trung, Nga – mục 13.1c, 13.1d – áp dụng khi gói website LP-v2 phát hành))
- Tài liệu không chứa mật khẩu, mã 2 bước, mã khôi phục, số tài khoản, mã cửa hay số giấy tờ. Khi học, anh/chị cũng không ghi những thứ này lên giấy.
- **Tài liệu nội bộ OTTIMO – không chuyển tiếp cho người ngoài OTTIMO, không gửi vào nhóm chat, không chụp, không đăng lên mạng. Nghỉ việc hoặc hết hợp tác: xóa tệp trên máy và báo chủ đầu tư.** Bộ hướng dẫn chỉ do chủ đầu tư gửi, và không bao giờ có ô đăng nhập hay hỏi mật khẩu; tệp "hướng dẫn" nhận từ người khác thì không mở, báo chủ đầu tư.

<!-- Nguồn: product/docs/manual/user-manual-v1.0.md bản 1.5 (Desk v1.0.0 = 8b3aec8) mục 0.2–0.9, 2.1–2.22, 3.6, 5.1, 5.4–5.6, 5.8; staff-one-pager.md Tờ 1, 2a, 2b, 4; day-one-guide.md mục 10. Chữ nói với khách giữ nguyên văn đã duyệt (UXD-on-PO-v1.0.0-docs.md mục 1.1–1.2, SEC-on-PO-v1.0.0-docs.md mục B). Tệp này thay các tờ in 1, 2a, 2b cho lễ tân (INV 30/10: "ko cần in 5 tờ hướng dẫn"). Tờ 4 "Your ID details" vẫn là thông báo cho khách – xem mục 7.2. Bản 1.2: mục 13.1a–13.1b theo rounds/round-03/outputs/SEC/esc041-gchat-full-details.md mục L2.2, L2.4 (★4, ★7), N5; ARC gchat-booking-request-notify.md mục 8.1; SEC-on-us155-smoke-L.md (cách tìm nút WR8); chuỗi Desk webreq.erase*. Bản 1.3 (01/11): mục 13.1c theo US-131 AC4, AC10, BR-115, chuỗi Desk webreq.estimate_* (nhánh lp-v2); mục 13.1d theo US-175 AC3, AC4, AC6, ESC-044 và INV 01/11 câu 9 (Google Dịch được dùng trên mọi màn hình Desk), BR-912 (4); câu mẫu do CPY viết (rounds/round-04/outputs/CPY/lp-v2-copy.md). Bản 1.5 (03/11): mục 5.4, 9.3, 11.5, 16.1, 17.5, bài tập 12 theo FB-R4-DOM-BA-05 (rounds/round-04/reviews/DOM-on-PR22-BUG-R4-014.md Lượt 2, ý 1–9), ESC-048 = B, BR-207, BR-210, BR-214, BR-313 v0.5.1, BR-428, BR-502, chuỗi Desk early_departure.* tại 9d4f0fa8 (nhánh v1.0.2-ed); ORC 03/11 bỏ nhánh HĐ ký trước 01/11/2026; chữ khung HĐ theo chuỗi Desk @ 52702857 (FE-A sửa theo UXD-on-PR22-lease-strings.md thẻ 26–31). -->

## Cách đọc tệp này

- Chữ **in đậm** là tên nút, tên màn hình, tên ô đúng như trên Desk. Bản vá hằng tuần có thể đổi vị trí nút hoặc vài chữ nhỏ; việc phải làm thì giữ nguyên.
- Ảnh màn hình có mã ở dưới ảnh (ví dụ C2-05). Khung nét đứt ghi **Chưa có ảnh** hoặc **Ảnh mới · chờ chụp** là ảnh đang chờ chụp: cứ làm theo chữ.
- Khung **Tạm ở v1.0** là việc Desk chưa làm được và cách làm thay. Khung **Lỗi đang sửa** là lỗi đội đã biết; làm theo cách tạm trong khung. Mọi cách tạm tới v1.0.3 và các bản sau gom ở **mục 17**.
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

**Email nhận thông báo bảo mật** (có từ v1.0.3): tài khoản có vai quản lý **phải có**. Nhập sau khi chủ đầu tư báo đã nhập email của mình. Làm theo mục 1.6.

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
- Máy quầy đã cấp quyền **không cài, không mở Zalo, Zalo Web hay ứng dụng chat** nào, **không đăng nhập hộp thư riêng** (Gmail hay email của ai), và không dùng để nhắn khách (mục 4.1, 1.6).

> **Lỗi nhỏ đang sửa (v1.0.3 hoặc v1.0.4):** trên máy chưa cấp quyền, nút **Nhập nơi nhận hoàn** vẫn hiện, nhưng bấm **Lưu** thì Desk không lưu và báo "Máy này chưa được cấp quyền xem giấy tờ và mã cửa…". Gặp câu này: chuyển sang máy quầy đã cấp quyền, làm lại.

[ẢNH: C0-08-Chip máy quầy đã cấp quyền]
[ẢNH: C0-11-Chip máy chưa cấp quyền]

### 1.6 Đăng xuất

1. Bấm **tên của mình** ở góc trên bên phải.
2. Bấm **Đăng xuất**.

Đăng xuất **mỗi lần rời máy**, kể cả rời một lát. Trước khi người khác dùng máy quầy, anh/chị phải đăng xuất.

Menu dưới tên của mình gồm: **Đổi mật khẩu** · **Bảo mật tài khoản** · **Ngôn ngữ giao diện** · **Giao diện** (Theo máy / Sáng / Tối) · **Đăng xuất**. Trước v1.0.3, mục **Bảo mật tài khoản** có tên **Xác thực 2 bước**.

[ẢNH: C0-06-Menu Tài khoản]

**Email nhận thông báo bảo mật** (có từ v1.0.3). OTTIMO gửi thư báo tới email này khi có việc quan trọng với tài khoản (dùng mã khôi phục, đặt lại 2 bước, đổi email).
- Tài khoản có vai quản lý (người trực hiện nay): **bắt buộc**. Nhập **sau khi** chủ đầu tư báo đã nhập email của mình. Lễ tân trưởng không có vai quản lý: không bắt buộc, **khuyến khích** thêm email riêng. Lễ tân: không bắt buộc.
- **Chọn hộp thư:** email riêng **chỉ mình đọc**, ví dụ `ten.rieng@example.test`. **Không dùng hộp thư chung** của cơ sở: `info@ottimo.vn`, `booking@ottimo.vn`, Gmail dùng cho Booking.com/Agoda/Airbnb, hộp thư của quầy. Ai đọc được hộp thư chung cũng đọc và xóa được thư báo của anh/chị. **Tới v1.0.3, Desk chỉ chặn được `info@`.** Từ v1.0.4 chặn cả `booking@` (kể cả `info+…@`, `booking+…@`). Các hộp thư chung khác anh/chị phải tự tránh. **Không đăng nhập hộp thư này trên máy quầy** (mục 1.5), không cài tự chuyển tiếp sang hộp thư khác.
- Cách nhập:
  1. **Tên của mình → Bảo mật tài khoản**, khối **Email nhận thông báo bảo mật**.
  2. Nhập email vào ô **Email**. Bấm **Thêm email** (đã có email thì **Đổi email** → **Lưu email**).
  3. Hộp xác nhận hiện **Địa chỉ mới**. Đọc lại. Nhập **Mật khẩu đăng nhập**, và **Mã trong ứng dụng xác thực (6 số)** nếu tài khoản có 2 bước. Bấm **Lưu email**.
     - Địa chỉ là `info@` (từ v1.0.4: cả `booking@`): sau khi bấm **Lưu email**, Desk báo dưới ô **Email**: "Đây là hộp thư chung của cơ sở. Thông báo bảo mật cần tới một email riêng." Mật khẩu và mã không bị tính là sai. Nhập email riêng khác.
     - "Mật khẩu hoặc mã chưa đúng. Kiểm tra lại rồi nhập mã mới.": tài khoản có 2 bước thì chờ ứng dụng hiện mã mới, nhập lại. Tài khoản **không có** 2 bước (không có ô mã): câu này nghĩa là **mật khẩu chưa đúng**, nhập lại mật khẩu.
     - Sai **5 lần**: "Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại." (khoảng 15 phút). Trong lúc đó mọi thao tác cần mật khẩu và mã đều chờ, không riêng khối email. Không tự sai 5 lần mà vẫn thấy câu này: báo chủ đầu tư.
  4. Desk báo "Đã lưu. Thông báo đã gửi tới địa chỉ này. …" (lần đầu) hoặc "Đã lưu. Thông báo đã gửi tới địa chỉ mới và địa chỉ cũ. …" (khi đổi). Mở hộp thư trên **điện thoại riêng**, tìm thư **OTTIMO – Security notice**. Sau 15 phút chưa thấy: xem mục Spam, rồi kiểm lại địa chỉ.
- Mỗi lần email đổi, thư gửi tới địa chỉ mới, địa chỉ cũ và các chủ đầu tư. Thư không có link, không hỏi mật khẩu hay mã.
- Desk hiện **đủ** địa chỉ email ở khối này: **không chụp màn hình** khối này để gửi chat hay báo lỗi, báo bằng lời.
- Nhận **bất kỳ** thư báo nào của OTTIMO về việc mình không làm: không trả lời, không bấm gì trong thư. Mở Desk bằng cách **gõ địa chỉ**, **đổi mật khẩu**, **gọi điện** cho chủ đầu tư ngay (không nhắn Zalo). Người trực có vai quản lý còn nhận thư "đã dùng mã khôi phục" và "đặt lại 2 bước" cho tài khoản của mình: làm như trên. Bảng đủ 4 loại thư: `01` mục 1.6a.
- Đội báo **tạm quay về bản trước**: menu trở lại tên **Xác thực 2 bước**, khối email tạm ẩn. Email đã lưu vẫn dùng, không cần nhập lại.

[ẢNH: C0-12-Khối Email nhận thông báo bảo mật]

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
| Mất cả điện thoại lẫn mã khôi phục | **Báo chủ đầu tư.** Chủ đầu tư **gặp tận mặt** anh/chị rồi mới làm, không làm theo tin nhắn hay cuộc gọi. **Từ v1.0.4:** chủ đầu tư **Đặt lại xác thực 2 bước** cho anh/chị (`01` mục 1.9). Anh/chị **giữ tài khoản cũ**: đăng nhập lại trên laptop riêng bằng tên đăng nhập và mật khẩu của mình. Điện thoại bị lấy cắp, hoặc mật khẩu Desk có lưu hay ghi trên điện thoại đó: nói với chủ đầu tư để **Đặt lại mật khẩu** luôn, rồi đổi mật khẩu tạm như mục 1.2. Tài khoản có vai quản lý: Desk mở **Bật xác thực 2 bước**, làm lại như mục 1.3 trên điện thoại mới. Lễ tân trưởng: bật lại ở **tên của mình → Bảo mật tài khoản → Bật ngay** ngay buổi đó. **Ở v1.0.3** (tới khi chủ đầu tư báo v1.0.4 đã lên): chủ đầu tư khóa tài khoản cũ và tạo cho anh/chị tài khoản mới (tên đăng nhập mới; chủ đầu tư làm theo `01` mục 1.7). Đăng nhập lần đầu như mục 1.2 trên laptop riêng. Tài khoản có vai quản lý: bật 2 bước, rồi **nhập email nhận thông báo ngay** (mục 1.6). Không xin mã của người khác, không dùng tài khoản người khác trong lúc chờ |
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

**Không bật đăng nhập 2 bước ở v1.0.x** cho tài khoản lễ tân trưởng dùng app nhân viên. App chưa đăng nhập được bằng 2 bước (báo như câu ở đầu mục này, không có ô nhập mã): bật ở **tên của mình → Bảo mật tài khoản** thì mất app nhân viên. **Lỡ bật:** đăng nhập Desk bằng mật khẩu và mã → **tên của mình → Bảo mật tài khoản → Tắt xác thực 2 bước** (xác nhận bằng mật khẩu và mã) → đăng nhập lại app bằng mật khẩu như cũ. Mất cả điện thoại lẫn mã khôi phục: **báo chủ đầu tư**. Chủ đầu tư gặp tận mặt anh/chị, khóa tài khoản cũ và tạo tài khoản mới (tên đăng nhập mới) theo `01` mục 1.7; ở tài khoản mới, không bật 2 bước. Đội kỹ thuật không đặt lại 2 bước cho anh/chị.

Lần đầu, và sau mỗi lần chủ đầu tư **Đặt lại mật khẩu**: đổi mật khẩu tạm trên Desk trước (mục 1.2), rồi mới đăng nhập app nhân viên. App chưa có màn đổi mật khẩu tạm: còn mật khẩu tạm mà vào app thì mọi màn báo "Chưa tải được … Có thể do mạng yếu" (mục 17.6).

> **Áp dụng từ v1.0.4** (khi chủ đầu tư báo v1.0.4 đã lên; tới lúc đó làm như trên):
> - **App nhân viên có bước nhập mã.** Tài khoản đã bật 2 bước (kể cả tài khoản có vai quản lý như người trực) đăng nhập app được: nhập mật khẩu, rồi nhập **mã 6 số** trong ứng dụng xác thực. Mất điện thoại: bấm **Mất điện thoại? Dùng mã khôi phục**. Sai 5 lần hoặc quá 5 phút, app báo "Bước nhập mã đã hết hạn. Đăng nhập lại bằng mật khẩu.": đăng nhập lại từ đầu. Mạng yếu ở bước này: mã đã gõ vẫn còn, kiểm tra mạng rồi bấm **Thử lại**.
> - **Mật khẩu tạm đổi ngay trên app.** Lần đầu, hoặc sau khi chủ đầu tư **Đặt lại mật khẩu**, app mở màn **Đặt mật khẩu của bạn**: nhập **Mật khẩu hiện tại** (mật khẩu tạm), **Mật khẩu mới**, **Nhập lại mật khẩu mới** (đã bật 2 bước thì nhập thêm mã 6 số), bấm **Lưu và vào ứng dụng**. Không cần lên Desk trước. Không còn câu "Có thể do mạng yếu" vì mật khẩu tạm.
> - **Bật 2 bước chỉ làm trên Desk** (`desk.ottimo.vn`, trên máy tính; quét mã bằng chính điện thoại của mình, cất 10 mã khôi phục như `01` mục 1.3). App không có màn bật 2 bước. App báo "Tài khoản của bạn cần bật xác thực 2 bước trước khi làm việc." kèm câu "Mở OTTIMO Desk trên máy tính để bật xác thực 2 bước, rồi đăng nhập lại ở đây.": làm theo câu đó, rồi đăng nhập lại app. Câu này cũng hiện sau khi vào app bằng mã khôi phục (phải đăng ký lại 2 bước trên điện thoại mới).
> - Đoạn "Không bật đăng nhập 2 bước ở v1.0.x" ở trên **hết hiệu lực từ v1.0.4**: app không còn chặn tài khoản có 2 bước.
> - **Lễ tân trưởng bắt buộc bật 2 bước** (mặc định đội chọn, chủ đầu tư đổi được). Bật trên Desk ngay buổi đăng nhập đầu, quét mã bằng điện thoại riêng của mình, cất 10 mã khôi phục. Chủ đầu tư thấy đã bật rồi mới giao việc. Desk chưa tự ép (dự kiến v1.0.5). Lễ tân trưởng mất điện thoại: kiểm căn bằng mắt theo mục 13.2a trong lúc chờ chủ đầu tư xử lý (mục 1.7). Mất cả mã khôi phục: chủ đầu tư gặp tận mặt rồi **Đặt lại xác thực 2 bước**; app về màn đăng nhập, anh/chị bật lại 2 bước trên Desk rồi đăng nhập app với mã 6 số mới.
> - Người trực có vai quản lý vào được app từ v1.0.4 và **kiểm căn trên app** (mục 14.2) thay cho tự kiểm rồi chỉ bấm **Làm xong** (mặc định đội chọn, chủ đầu tư đổi được). Mục 13.2a chỉ còn là dự phòng.

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
| **Mở quầy (muộn nhất 09:00)** | Đăng nhập, kiểm chip **Máy quầy đã cấp quyền**. Tờ **Your ID details** đúng chỗ, mặt quay ra khách. **Từ hôm sau ngày sổ giao ca có dòng "Thay tờ v2 hh:mm – tham số v2 hh:mm"** (hoặc từ ngày ghi ở dòng "Tờ v2 từ 06:00 dd/mm"): chân tờ có chữ v2 ("OTTIMO · ID notice · v2 · 11/2026"), cả tờ trong ngăn quầy. Chưa có dòng đó: tờ v1 là đúng, **không** tự thay tờ v2 | Mục 1.4, 7.2 |
| Mở quầy | Đọc **Cần chú ý** trước, xử lý từ dòng đỏ trở xuống. Xem **Khách đến (n)**, **Khách đi (n)**, **Giữ chỗ chưa cọc (n)**, **Yêu cầu của khách** | **Hôm nay** (mục 3.1) |
| Mở quầy | **Rà giữ chỗ – mốc 1** (tới v1.0.3) | Mục 17.1 |
| Mở quầy | Đọc sổ giao ca tối qua, **trang Không dịch** (đầu sổ, mục 13.1d) và dòng chủ đầu tư ghi trong lượt kiểm sáng. Đếm tiền mặt trong két. Khi có nhiều người: bàn giao với ca trước | Sổ giao ca |
| Mở quầy, 12:00, 18:00, đóng quầy | Kiểm extranet mọi kênh OTA; đơn mới thì nhập Desk ngay | Mục 5.3 |
| **Trước 11:00** | Căn trống từ đêm qua có khách đến hôm nay đã rà xong. Người trực hiện nay: tự kiểm rồi bấm **Làm xong** (mục 13.2a); **từ v1.0.4** kiểm trên app và bấm **Kiểm đạt – sẵn sàng** (mục 14.2), cùng mốc 11:00. Khi có lễ tân trưởng riêng: kiểm trên app xong trước 12:00 (mục 14.2) | **Buồng phòng** |
| **11:00** | **Rà giữ chỗ – mốc 2** (trước trần 12:00 ngày đến) | Mục 17.1 |
| **12:00** | Giờ trả phòng. Nhận phòng từ 12:00 nếu căn `VC`/`VI`. Khách đi chưa trả mà căn có khách đến tối nay: chốt giờ đi | Mục 7, 11, 11.4 |
| Ngay khi khách trả | Căn có khách đến cùng ngày: dọn, kiểm, bấm **Làm xong**. Từ v1.0.4: dọn, bấm **Làm xong**, rồi kiểm trên app, xong trước 14:00 | Mục 13.2a, 14.2 |
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

> **Lỗi nhỏ đã biết (sửa ở v1.0.3 hoặc v1.0.4):** trong **Cần chú ý**, dòng giữ chỗ sắp hết hạn chưa ghi mã đơn. Bấm vào dòng để mở đơn.

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
3. Chọn căn trong danh sách căn trống. Desk mở **Báo giá**: số đêm thường, số đêm thứ Sáu/thứ Bảy, phụ thu người, **Tổng tiền đơn**, **Cọc để giữ phòng** (30 % tiền phòng).
4. Chọn **Khách đứng tên** ngay trong hộp này (tìm, hoặc **Tạo nhanh khách**).
5. Bấm **Lưu báo giá**.
6. Chọn **Ngôn ngữ gửi khách** (Tiếng Việt, English, Русский). Bấm **Sao chép gửi Zalo**. Dán vào tin nhắn riêng với khách.
   Báo giá lập từ **Yêu cầu từ website**: Desk chọn sẵn ngôn ngữ theo khách. Khách viết bằng tiếng Hàn, tiếng Trung: **English**. Khách viết bằng tiếng Nga: **Русский** (mục 13.1d). Nhìn lại ô này trước khi bấm **Sao chép gửi Zalo**.
7. Báo giá giữ giá **3 ngày**. Hết hạn thì **Lập báo giá mới**.

[ẢNH: C2-03-Báo giá, tab căn trống]
[ẢNH: C2-04-Hộp báo giá]

### 4.3 Giữ chỗ khi khách đồng ý

1. Trong báo giá, bấm **Khách đồng ý – Giữ chỗ**.
2. Hộp **Giữ chỗ**: chọn **Giữ trong** 12 h, 24 h hoặc 48 h (mặc định 24). Hạn giữ không vượt 12:00 ngày đến. Tới v1.0.3: chọn thời hạn để giờ hết hạn rơi vào **09:00–21:00**. Ví dụ tạo lúc 15:00: chọn **24 h** (hạn 15:00 hôm sau), không chọn 12 h (hạn 03:00 sáng).
3. Bấm **Tạo giữ chỗ**. Desk tạo đơn **Giữ chỗ · chờ cọc** và mã **VietQR** đúng số cọc, nội dung chuyển khoản là **mã đơn**.
4. Gửi mã QR cho khách theo mục 4.1 (**Sao chép số tiền**, **Sao chép nội dung** nếu khách tự gõ).
5. Mã có dòng **"Tài khoản nhận vừa đổi"**: chưa gửi, gọi chủ đầu tư xác nhận trước (mục 10.2).
6. Desk nhắc 2 giờ trước khi hết hạn.
7. Quá hạn chưa cọc: Desk tự hủy và mở bán lại căn.

[ẢNH: C2-05-Giữ chỗ và mã VietQR cọc]

> **Lỗi nhỏ đã biết (sửa ở v1.0.3 hoặc v1.0.4):** hộp "Giữ chỗ" hiện số cọc và nội dung chuyển khoản hai lần; khách đến hôm nay vẫn hiện ô chọn thời hạn giữ dù không giữ được.

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
   - Nội bộ: phòng dùng nội bộ, mặc định không thu tiền, vẫn chiếm phòng. Chỉ tạo khi chủ đầu tư hoặc quản lý đã đồng ý. **Ghi chú nội bộ** ghi người cho, lý do, số đêm miễn phí. Người ở cần ở thêm: tới khi chủ đầu tư báo v1.0.4 đã lên, **không bấm Gia hạn** (Desk tính giá Trực tiếp cho đêm thêm, BUG-R4-038); làm theo mục 9.3 bước 7.
     - **Giá mỗi đêm của đơn Nội bộ** (bước 8): có thu thì gõ giá cho **mọi** đêm; miễn phí cả đơn thì để trống **mọi** ô (đơn 0 đ). Không gõ 0 vào ô: Desk không nhận (từ v1.0.4 Desk báo "Miễn phí: để trống ô. Có thu: nhập giá lớn hơn 0."). Từ v1.0.4, gõ một phần số đêm thì Desk chặn, không tạo đơn, và báo "Đơn Nội bộ: nhập giá cho mọi đêm, hoặc để trống hết nếu miễn phí cả đơn."
     - **Đơn Nội bộ có cả đêm thu và đêm miễn phí:** gõ giá cho mọi đêm, đêm miễn phí gõ cùng giá với đêm có thu. Ghi trong **Ghi chú nội bộ** đêm nào miễn phí, ai cho, và "chờ quản lý sửa 0 đ". Quản lý hoặc chủ đầu tư mở **Folio & điều chỉnh** → dòng tiền phòng của đêm đó → **Điều chỉnh** → **Giá đêm mới (trước giảm theo số đêm)** 0, ghi **Lý do điều chỉnh**. Bỏ qua dòng chữ nhỏ dưới ô giá (nói sàn–trần và xin giảm giá đặc biệt): đêm của đơn Nội bộ không áp sàn–trần, gõ 0 lưu được. Chữ cũ, sửa ở v1.0.5. Làm ngay sau khi tạo đơn, muộn nhất **trước khi nhận phòng**: lúc nhận phòng Desk thu đủ tiền phòng, kể cả đêm chưa về 0. **Không** dùng miễn phí (FOC) hay giảm giá đặc biệt 100 %. Sửa xong, lễ tân kiểm **Folio**: tiền phòng và **Còn phải thu** đúng số.
     - Lễ tân và lễ tân trưởng không sửa được về 0. Chưa có quản lý thì để đơn như đã gõ và ghi sổ giao ca. Tới lúc **nhận phòng** mà đêm đó chưa về 0 (Folio còn tiền của đêm miễn phí): **chưa thu**. Gọi quản lý hoặc chủ đầu tư sửa (làm được từ xa trên Desk), kiểm lại **Còn phải thu**, rồi mới thu và nhận phòng. Không liên lạc được ai: thu đúng số Desk đòi, ghi sổ giao ca "OTM-…: thu dư … cho đêm miễn phí dd/mm, chờ quản lý sửa 0 đ". Quản lý sửa trước khi trả phòng. Lúc trả phòng, bước **Bill & thu tiền** báo khách trả thừa: hoàn phần dư như mục 11.1 bước 6.
     - Đêm đầu hoặc đêm cuối đã về 0 thì phụ thu nhận sớm hoặc trả muộn của đêm đó cũng 0. Đêm đầu miễn phí mà khách nhận sớm: đêm đó phải về 0 trước khi nhận phòng thì phụ thu nhận sớm mới là 0.
     - **Tới v1.0.3** Desk chưa chặn: gõ một phần thì Desk bỏ hết số đã gõ, đơn thành 0 đ mà không báo. Gõ đủ mọi đêm hoặc để trống hết.
<!-- DOM BR-105 v0.5.8 (1)–(5) (ARC-on-v104-pr82-rate-source.md mục 8); v0.5.9 (4): hạn sửa về 0 là trước khi nhận phòng, vì B9 điều kiện balance_paid thu đủ tiền phòng mọi kênh trừ OTA trả trước (DOM #72 thẻ 01). Chặn gõ một phần: FE #82, gộp main f9ff4e1f (câu booking.error.rate_empty_internal; gõ 0: booking.error.rate_zero_internal, v1.0.3 báo booking.error.rate_empty). Sửa đêm về 0 (A31, chỉ OWN/MGR, đơn còn Giữ chỗ / Đã xác nhận / Đang ở): #71, gộp main 2c8cd8cf; FolioDialog nhận 0, chữ folio.adjust_night_help vẫn nhắc sàn–trần và xin giảm giá đặc biệt (không áp cho đêm Nội bộ, folio-lines.service.ts); câu "Bỏ qua dòng chữ nhỏ…" theo UXD #72 thẻ 06, khóa riêng folio.adjust_night_help_internal ở v1.0.5 thì bỏ câu này. Dự phòng giảm 100 % của DOM không cần nữa. -->
5. **Khách đứng tên**: gõ tên, SĐT, email hoặc mã khách để tìm. Chưa có thì **Tạo nhanh khách "…"** → hộp **Hồ sơ khách mới**: Họ và tên, **Số điện thoại / Zalo** (cần ít nhất SĐT hoặc email), Quốc tịch, Ngôn ngữ giao tiếp.
6. Kênh Trực tiếp và CTV **bắt buộc có số điện thoại**. Ô **Số điện thoại / Zalo** trên form chỉ hiện khi hồ sơ khách chưa có số. **Email** không bắt buộc.
7. **Giờ đến dự kiến** (nếu khách báo).
8. **Giá mỗi đêm**: Desk điền theo lịch giá (**Nguồn giá** ghi rõ). Chỉ sửa khi đã chốt giá khác với khách, trong khoảng **sàn–trần**. Từ ngày chủ đầu tư chuyển giá, Desk không giảm theo số đêm: gõ đúng giá đã chốt với khách. Cột **Giá lịch/đêm (trước giảm theo số đêm)** vẫn ghi "trước giảm theo số đêm": chữ cũ. Đơn từ 7 đêm mà Desk hiện dòng "Đã giảm …% vì ở từ 7 đêm (BR-107)": dừng, báo quản lý. Đơn **Nội bộ**: xem bước 4.
   - **Giá đã gõ khi đổi thông tin khác trên hộp (từ v1.0.4):**
     - Desk **giữ** giá đã gõ khi đổi số khách, đổi ngày (các đêm còn trong khoảng), đổi giữa **Trực tiếp** và **CTV**, đổi sang căn **cùng nhóm căn**, hoặc đổi căn của đơn **OTA** / **Nội bộ**.
     - Desk **xóa** giá đã gõ khi đổi kênh sang hoặc rời **OTA** / **Nội bộ**, và khi đổi căn của đơn **Trực tiếp** / **CTV** sang căn **nhóm khác**. Desk báo "Đã xóa giá đã gõ vì đổi kênh." hoặc "Đã xóa giá đã gõ vì căn … thuộc nhóm căn khác. Kiểm lại giá mỗi đêm trước khi tạo đơn." Đổi nhóm căn thì Desk tính lại theo lịch giá căn mới; muốn giữ ưu đãi cho khách thì gõ lại, trong sàn–trần của nhóm mới.
     - Đêm mới thêm khi đổi ngày: Trực tiếp, CTV lấy giá lịch; OTA làm theo bước 4 mục 5.3.
     - Tới v1.0.3, đổi căn, ngày, số khách hay kênh có thể làm Desk bỏ giá đã gõ hoặc giữ số của lựa chọn trước: chọn xong căn, ngày, số khách, kênh rồi mới gõ giá.
     - Bản nào cũng vậy: kiểm lại từng đêm ngay trước khi bấm **Tạo đơn**. Từ v1.0.4, cột **Nguồn giá** ghi **Giá đã gõ** ở đêm đã gõ tay, **Giá niêm yết (BR-101)** ở đêm Desk điền, "–" ở ô trống. Tới v1.0.3 cột này có thể ghi nhãn lịch giá cả ở đêm đã gõ; đơn vẫn lưu đúng số đã gõ.
9. Xem **Tổng tiền phòng**, **Cọc cần thu**.
10. Ô **Số tiền đã nhận** được điền sẵn bằng số cọc. **Chỉ để nguyên khi khách đã chuyển thật** (đã kiểm theo mục 10.3): chọn **Cách thanh toán**, ghi **Mã giao dịch / ghi chú**, bấm **Tạo đơn**. Desk chọn sẵn **Chuyển khoản VietQR** – đổi đúng cách khách đã trả trước khi bấm **Tạo đơn**.
11. Khách chưa chuyển: bấm **Giữ chỗ đến …** (chỉ có với kênh Trực tiếp/CTV và ngày đến từ ngày mai).
   - **Giá thỏa thuận (đã gõ ở bước 8), khách chưa chuyển cọc** (áp dụng ngay, tới v1.0.5). Tới v1.0.3, **Giữ chỗ đến …** bỏ giá đã gõ mà không báo. Từ v1.0.4, còn giá đã gõ thì Desk khóa nút này và báo "Giữ chỗ chỉ theo giá niêm yết. Đã nhận cọc thì bấm Tạo đơn để lưu giá đã gõ. Chưa nhận cọc thì xóa giá đã gõ rồi giữ chỗ, xác nhận cọc xong thì Điều chỉnh giá ở Folio." Giữ chỗ luôn tính cọc 30 % theo giá niêm yết.
     - **Khách chuyển ngay, trong vài phút:** không giữ chỗ. Tiền về thì **Tạo đơn** với giá đã gõ, cọc 30 % theo giá thỏa thuận.
     - **Phải giữ căn lâu hơn:** xóa các ô giá đã gõ (từ v1.0.4, xóa hết thì nút mở lại), rồi bấm **Giữ chỗ đến …** theo giá niêm yết. Ghi sổ giao ca "OTM-…: giá thỏa thuận … đ/đêm". Báo khách **đúng số cọc Desk hiện** ở giữ chỗ, và nói rõ phần chênh được trừ vào tiền còn lại khi nhận phòng. Không báo cọc theo giá thỏa thuận: số đó thấp hơn mức Desk đòi, nên không **Xác nhận đã nhận cọc** được. Ví dụ: Studio niêm yết 800.000, thỏa thuận 700.000, 2 đêm: cọc giữ chỗ là 500.000; theo giá thỏa thuận chỉ 400.000.
     - **Tiền về:** **Xác nhận đã nhận cọc** như thường (mục 4.4). Ngay sau đó: khung đơn → **Folio & điều chỉnh** → từng dòng tiền phòng → **Điều chỉnh** → **Giá đêm mới (trước giảm theo số đêm)** là giá thỏa thuận; **Lý do điều chỉnh** "Giá thỏa thuận lúc đặt". Từ ngày chủ đầu tư chuyển giá không còn giảm theo số đêm: chữ "trước giảm theo số đêm" trên ô là chữ cũ, gõ đúng giá thỏa thuận. Kiểm **Folio**: tiền phòng bằng tổng thỏa thuận; **Còn phải thu** bằng tổng thỏa thuận trừ cọc đã nhận. Giá thỏa thuận dưới sàn thì không dùng cách này: làm giảm giá đặc biệt có duyệt (mục 9.5).
     - **Không** giữ chỗ theo giá niêm yết rồi, khi tiền về, tạo một đơn mới: phải hủy giữ chỗ trước, căn bị bỏ trống và ca khác hoặc website có thể bán mất.
     - **Khách hủy sau khi đã cọc theo giá niêm yết:** phí hủy tính trên cọc đã nhận. Phần cọc vượt mức theo giá thỏa thuận (100.000 ở ví dụ trên) hoàn đủ, quản lý duyệt.

[ẢNH: C2-07-Đặt phòng mới, kênh Trực tiếp]

Desk chặn và giải thích khi:
- **Đặt trùng** căn và đêm đã có đơn. Desk gợi ý **Căn trống cùng nhóm**.
- Ngày đến thứ Sáu, thứ Bảy hoặc ngày đặc biệt mà chỉ ở 1 đêm: "Ngày này cần ở tối thiểu 2 đêm". Ngoại lệ đêm lẻ giữa hai đơn: Desk gợi ý **Dùng căn … (đêm lẻ)**.
- Vượt sức chứa căn.
- Từ **30 đêm** trở lên (từ ngày chủ đầu tư chuyển giá): Desk mở **… đêm là thuê dài hạn** → **Tạo đơn dài hạn nhập tay** (mục 5.4). Câu Desk "Từ 28 đêm …" là chữ cũ, số đúng là 30: đơn 28–29 đêm vẫn là đơn ngắn ngày.
- Đặt khi mất mạng: Desk giữ **nháp** trên máy, tạo đơn khi có mạng.

> **Lỗi nhỏ đã biết (v1.0.3 hoặc v1.0.4):** sau **Tạo nhanh khách**, ô **Khách đứng tên** đôi khi vẫn đỏ tới lần bấm sau. Bấm lại vào ô là hết.

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

### 5.4 Đơn dài hạn nhập tay

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
> - **Lịch thu**: lễ tân trưởng giữ bảng kỳ thu (giấy hoặc bảng tính trên máy quầy; không ghi số giấy tờ): căn, khách, **ngày kết thúc HĐ** (theo HĐ giấy, không đổi khi gia hạn), kỳ, số tiền, hạn, **ngày đã thu**. Nhắn khách 7 ngày trước hạn và đúng ngày hạn, trong khung 08:00–21:00. Khi khách rời sớm, bảng này cho biết kỳ cuối đã thu chưa (mục 11.5.3).
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

Từ ngày chủ đầu tư chuyển giá (bảng giá 01/11):

| Khách vào căn lúc | Desk tính |
|---|---|
| Từ **11:00** (căn đã sạch hoặc đã kiểm – `VC`/`VI`) | **Không phụ thu** |
| **10:00–10:59** | Phụ thu **30 %** giá đêm đầu |
| **06:00–09:59** | Phụ thu **50 %** giá đêm đầu |
| Trước **06:00** | Không phải phụ thu: Desk **thêm đêm trước** (tiền phòng 1 đêm) |

- Ví dụ Studio 800.000: nhận 11:00 → 0; 10:30 → 240.000; 08:00 → 400.000. Sau ngày chuyển giá Desk còn tính phụ thu cho giờ 11:00–11:59: báo quản lý.
- Câu nói với khách: "Check-in is from 12:00. Your room is always ready by 14:00." / "Nhận phòng từ 12:00. Phòng luôn sẵn sàng lúc 14:00." **Không** hứa "phòng sẵn sàng từ 12:00". Không phụ thu từ 11:00 là việc lễ tân làm khi căn đã sẵn sàng, không hứa trước với khách.
- Khách tới 12:00–14:00 mà căn chưa xong: giữ hành lý, mời chờ ở sảnh hoặc đi dạo, hẹn giờ. Không phụ thu, không giảm giá. Gửi hành lý không tính phụ thu.
- Quá 14:00 vẫn chưa xong: lễ tân trưởng hoặc quản lý đổi căn sẵn sàng hoặc nâng hạng, ghi lý do.
- Đơn OTA: phụ thu nhận sớm/trả muộn tính trên giá Trực tiếp hiện hành của đêm đó, **chỉ khi chủ đầu tư đã đăng giờ nhận/trả và mức phụ thu trong nội quy của kênh đó**.

> **Tạm ở v1.0 – khách đặt qua Booking.com, Agoda, Airbnb:** chỉ thu phụ thu nhận sớm khi chủ đầu tư đã báo kênh đó đổi giờ nhận phòng 12:00 trong nội quy. Kênh chưa đổi: vẫn ghi giờ nhận thật, chọn **Xin miễn phụ thu (gửi duyệt)**, lý do "Kênh OTA chưa đăng phụ thu", báo quản lý. Lễ tân trưởng giữ danh sách kênh đã đăng do chủ đầu tư báo.

### 7.2 Tờ "Your ID details" – cho khách xem trước khi nhận giấy tờ

**Mọi khách làm giấy tờ tại quầy phải được xem tờ "Your ID details" trước khi anh/chị nhận giấy tờ.** Đây là thông báo bắt buộc cho khách về việc dùng thông tin giấy tờ.

> **Áp dụng từ v1.0.4 – tờ bản v2.** Nội dung dưới đây là **bản v2**: thêm một đoạn về dịch tin nhắn (EN đoạn 4, VI đoạn 4), chân tờ "OTTIMO · ID notice · v2 · 11/2026". Tới ngày thay tờ, quầy vẫn dùng **bản v1** đang dán (không có đoạn dịch, chân tờ "OTTIMO · ID notice · 11/2026"): cho khách xem như cũ.
>
> **Ngày thay tờ** (chủ đầu tư hẹn trước; phần của chủ đầu tư ở `00-index.md` mục 4). Thay tờ và chủ đầu tư đặt tham số phải liền nhau, vì Desk ghi bản nào thì khách phải đọc đúng bản đó. Chủ đầu tư đã Lưu thì trong ngày không quay về v1 được:
> 1. Chỉ làm sau khi chủ đầu tư báo v1.0.4 (có gói P4-16) đã lên. Thay buổi sáng, trong khung **09:00–11:00**, lúc không có khách ở quầy và không có khách hẹn nhận phòng sớm. **Không thay sau 12:00.**
> 2. Gỡ tờ v1 ở khung mica **và** trong ngăn quầy. Đặt tờ v2 (và tờ EN/RU nếu chủ đầu tư đã in). Máy tính bảng: chép tệp v2; tệp v1 đổi tên hoặc chuyển ra thư mục riêng, chỉ xóa khi có tin "Đã đặt v2".
> 3. Nhắn chủ đầu tư: "Đã thay tờ v2 – hh:mm". Giờ này là **mốc**. Chủ đầu tư gọi anh/chị hỏi "Tờ v2 còn trên quầy chứ?" và Lưu trong lúc còn gọi, kiểm lại trên Desk, rồi nhắn "Đã đặt v2 – hh:mm". Trả lời đúng điều anh/chị thấy trên quầy. Lưu xong, chủ đầu tư nói "**Đã Lưu**" trước khi gác máy. Chủ đầu tư nói Desk báo lỗi khi Lưu (bất kỳ lỗi nào ở ô **Giá trị mới**) nghĩa là **chưa lưu gì**: tờ v2 vẫn để trên quầy, chờ chủ đầu tư dán lại rồi Lưu. Nghe "**Đã Lưu**" thì giữ tờ v2, kể cả khi đã nhắn "Đặt lại v1" (bước 6). Chủ đầu tư nói Lưu nhầm ngày (Desk hẹn v2 từ ngày mai): tờ v2 vẫn để trên quầy trong lúc còn gọi; chủ đầu tư **Hủy lịch** rồi Lưu lại và nói "**Đã Lưu**". Chủ đầu tư nói chỉ hủy lịch, không Lưu: làm theo bước 6 (đặt lại v1).
> 4. Tới khi nhận tin "Đã đặt v2": **không nhận giấy tờ của khách mới**. Khách tới thì mời ngồi đợi vài phút.
> 5. Nhận tin "Đã đặt v2": tải lại (F5) mọi trang giấy tờ đang mở trên máy quầy. Khách đang làm dở mà Desk báo "Chọn một giá trị trong danh sách." ở Khối 1 khi lưu câu trả lời đồng ý lưu ảnh: cho khách xem tờ v2, tải lại (F5), hỏi lại câu đồng ý lưu ảnh (mục 8.2). **Không chọn sẵn thay khách.**
> 6. Chờ tối đa **15 phút** từ mốc. Đang nói chuyện với chủ đầu tư mà được bảo "chờ" thì chờ tiếp. Quá 15 phút, không có tin "Đã đặt v2" và không gọi được chủ đầu tư: nhắn "Đặt lại v1 – hh:mm" **trước**, rồi mới đặt lại tờ v1 vào khung mica và ngăn quầy; máy tính bảng mở lại tệp v1, xóa tệp v2 (không còn tệp v1 thì hôm đó không dùng máy tính bảng). Tờ v2 cất **khỏi quầy**, trong phong bì ghi "Tờ v2 – chờ chủ đầu tư hẹn ngày thay", chưa hủy. Nhận khách như cũ. Sổ giao ca ghi "Đặt lại v1 hh:mm – tờ v2 cất ở …". Chủ đầu tư hẹn hôm khác, làm lại từ bước 1.
>    Đã nhắn "Đặt lại v1" mà chưa đặt tờ v1, chủ đầu tư gọi tới: nói rõ "vừa nhắn đặt lại v1, tờ v2 còn trên quầy" và làm theo lời chủ đầu tư. Nghe "**Đã Lưu**" thì giữ tờ v2, bỏ việc đặt lại v1.
>    Sau khi đặt lại v1, chủ đầu tư nhắn "**Tờ v2 từ 06:00 dd/mm**" (Desk đã hẹn v2 cho ngày đó mà không hủy được): giữ tờ v1 tới 05:59. Từ 06:00, trước khi nhận giấy tờ của khách đầu tiên, lấy tờ v2 trong phong bì đặt vào khung mica và ngăn quầy, cất tờ v1 như bước 10; máy tính bảng chỉ dùng khi chủ đầu tư đã chép lại tệp v2. Ghi sổ giao ca "Tờ v2 từ 06:00 dd/mm". Từ 06:00 đã nhận giấy tờ của khách khi quầy còn tờ v1: làm như bước 7.
> 7. **Tin đi chéo:** quầy đã để lại tờ v1 mà nhận tin "Đã đặt v2": Desk không quay về v1 trong ngày được. Ngừng nhận giấy tờ, đặt ngay tờ v2 (khung mica, ngăn quầy; máy tính bảng mở lại tệp v2). Với mỗi khách đã nhận giấy tờ trong khoảng quầy để tờ v1:
>    - sổ giao ca **chỉ** ghi mã đơn, giờ nhận giấy tờ, giờ cho xem tờ v2. Không ghi tên, số giấy tờ, quốc tịch, số điện thoại;
>    - cho khách xem tờ v2 lần gặp tiếp theo, trước khi trả phòng;
>    - **không** hỏi lại hay ghi lại câu đồng ý, **không** xóa hay nhập lại giấy tờ;
>    - khách không đồng ý xem, hoặc đã về mà chưa xem: ghi mã đơn và chữ "chưa xem v2" vào **trang Không dịch** (mục 13.1d), và **không** đưa tin nhắn của khách đó qua dịch vụ dịch (Google Dịch);
>    - khách xem v2 rồi nói không muốn dịch: ghi mã đơn và chữ "không dịch" vào **trang Không dịch**, không đưa tin của khách đó qua dịch vụ dịch;
>    - báo chủ đầu tư số đơn; chủ đầu tư nhắn đội chỉ số lượng.
> 8. Ghi sổ giao ca: "Thay tờ v2 hh:mm – tham số v2 hh:mm".
> 9. Khách đã làm giấy tờ trước giờ thay **không** phải xem lại. Người đi cùng đến sau thì xem tờ v2.
> 10. Tờ v1 gỡ ra: cất khỏi quầy, chỗ khách không thấy; có tin "Đã đặt v2" thì hủy. Không để tờ v1 và v2 cùng ở quầy.
> 11. **Từ hôm sau ngày sổ giao ca có dòng ở bước 8** (hoặc từ ngày ghi ở dòng "Tờ v2 từ 06:00 dd/mm"), mở quầy kiểm chân tờ có chữ v2, cả tờ trong ngăn quầy (mục 2). Chưa có dòng đó: tờ v1 là đúng, **không** tự thay tờ v2.
>
> **Khách đọc tiếng Nga:** dùng **tờ A4 EN/RU** (tiếng Anh bên trái, tiếng Nga bên phải), đặt cạnh tờ EN/VI ở quầy, mặt quay ra khách, từ ngày thay tờ v2 **nếu chủ đầu tư đã in** (tờ này chỉ in khi bản tiếng Nga đã duyệt). Tờ EN/RU chỉ có bản in A4; **máy tính bảng không có bản tiếng Nga**. Chưa có tờ EN/RU: cho khách xem tờ EN/VI và đọc to câu hạn lưu như đoạn dưới.

Cho khách xem theo thứ tự:
1. **Bản in khổ A4** trong khung mica trên quầy, mặt quay ra khách, chỗ khách đứng làm thủ tục, không bị che (cách chính, theo quyết định của chủ đầu tư 30/10).
2. **Bản in dự phòng** trong ngăn quầy. Tờ trên quầy hỏng hay mất thì thay ngay bằng bản này, ghi sổ giao ca để chủ đầu tư in lại trong ngày.
3. **Máy tính bảng của cơ sở** – chỉ khi chưa thay được bản in, và chỉ khi máy đạt đủ điều kiện dưới đây:
   - Máy **dành riêng** cho tờ này. **Không** dùng máy quầy hay màn hình máy quầy, điện thoại cơ sở, máy cá nhân, máy có app khóa cửa.
   - Máy **không** được cấp quyền thiết bị và **không** đăng nhập Desk, app nhân viên, Zalo, email, app khóa cửa.
   - Máy có mật mã màn hình. Trên máy chỉ có tệp **`your-id-details-tablet.html`** (hoặc bản PDF A4 của tờ), mở từ máy, không cần mạng.
   - Trước khi quay về phía khách: bật **Không làm phiền**, mở tờ, chạm một lần cho toàn màn hình, rồi khóa vào tờ (iPad: **Truy cập được hướng dẫn**; Android: **Ghim ứng dụng**). Nhìn lại: màn hình chỉ có tờ, dòng chân "OTTIMO · ID notice · v2 · 11/2026" (từ v1.0.4; trước đó là "OTTIMO · ID notice · 11/2026" như tờ đang dán).
   - Máy không đạt đủ điều kiện: **không dùng**.

Không có bản in nào và không có máy đạt điều kiện: không nhận giấy tờ, gọi chủ đầu tư.

Câu mời khách đọc (trước khi nhận giấy tờ):
- EN: "Before I take your ID, please read this note on how we use it."
- VI: "Trước khi nhận giấy tờ, mời anh/chị đọc tờ này về cách chúng tôi dùng thông tin."

Khách đọc tiếng Nga: cho xem tờ EN/RU (từ v1.0.4, khi đã có). Khách không đọc được tờ EN/VI hay EN/RU, hoặc khó đọc: đọc to câu hạn lưu (đoạn 3 của tờ, bản EN). Khách hỏi thêm về dữ liệu của mình: ghi lại yêu cầu, chuyển chủ đầu tư, không hứa ngày.

Nội dung tờ bản v2 (nguyên văn, không sửa chữ):

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
> We may use a translation service, such as Google Translate, to read your messages and reply to you. The text we translate may include your name, contact, stay details and message. The service handles this text under its own privacy policy, and its servers may be outside Viet Nam.
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
> OTTIMO có thể dùng một dịch vụ dịch, như Google Dịch, để đọc tin nhắn và trả lời bạn. Nội dung được dịch có thể gồm tên, liên hệ, thông tin lưu trú và lời nhắn của bạn. Dịch vụ này xử lý nội dung đó theo chính sách riêng của họ, và máy chủ của họ có thể đặt ngoài Việt Nam.
>
> Muốn xem, sửa hoặc xóa thông tin của bạn, vui lòng hỏi lễ tân.
>
> OTTIMO · ID notice · v2 · 11/2026

[ẢNH: G2-03-Tờ Your ID details khổ A4 trong khung mica trên quầy]

<!-- SEC S1 (SEC-on-BA-department-guides.md, 30/10): máy tính bảng chỉ là cách dự phòng thứ 3, đủ điều kiện mới dùng. Bản điện tử đúng chữ và dòng chân tờ (SEC D08). Bản 1.9 (04/11): chữ v2 chép nguyên văn từ product/docs/print/to-4-your-id-details-a4.html và staff-one-pager.md Tờ 4 trên nhánh v104/uxd-id-sheet-v2 @ 82df5fea (UXD; SEC-on-plan-v1.0.4.md mục 6.2, 6.4 ý 4–5 – thay tờ trước khi đặt privacy_notice_version = v2, cùng ngày). Tờ EN/RU: staff-one-pager.md Tờ 4ru, product/docs/print/to-4-your-id-details-a4-ru.html (UXD-on-privacy-v2-ru.md mục 3.2: chỉ in A4, không có bản máy tính bảng). Bản v1 giữ trong lịch sử repo. Bản in A4: product/docs/print/pdf/to-4-your-id-details-a4.pdf, product/docs/print/pdf/to-4-your-id-details-a4-ru.pdf. -->

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

> **Lỗi nhỏ đã biết (v1.0.3 hoặc v1.0.4):** chip **Cần nhập thông tin** / **Đã có** đè nút **Xem đủ số / ảnh**. Thu nhỏ trang (Ctrl và dấu trừ) nếu cần bấm.

### 7.4 Trường hợp đặc biệt khi nhận phòng

- **Căn chưa sẵn sàng** (`VD`, `CL`): lễ tân gửi **Gửi lễ tân trưởng xác nhận** kèm **Lý do**. Lễ tân trưởng tự xác nhận được; buồng chuyển "Có khách, cần dọn" và có việc dọn gấp.
  - **Trước khi gửi hoặc xác nhận:** kiểm căn (hoặc hỏi buồng phòng) thật sự không còn người, không còn đồ của khách, nhất là căn có khách **đổi phòng** trong hôm nay mà chưa chuyển xong. Còn người hoặc đồ: không xác nhận; chờ khách chuyển xong, hoặc đổi đơn mới sang căn trống khác.
  - **Lý do** ghi: "Đã kiểm căn trống lúc hh:mm, người kiểm: <tên nhân viên>". Không ghi tên hay thông tin của khách.
  - Trước khi giao mã căn này: trên app khóa, kiểm căn không còn mã nào khác còn hạn.
- **Căn còn khách: không có ngoại lệ, kể cả lễ tân trưởng.** Gồm căn đang có khách (`OC`, `OD`) và căn **còn đơn khác đang ở**, dù buồng hiện trạng thái nào.
  - Từ v1.0.4 Desk chặn: dòng **Buồng sẵn sàng (VI hoặc VC)** hiện khung đỏ, không có ô **Lý do**, chỉ có nút **Đổi căn / đổi ngày**. Nút này chỉ mở khung đơn: bấm **Đổi căn / đổi ngày** lần nữa trên khung đơn (mục 6.1). Tới v1.0.3 Desk vẫn cho gửi xác nhận: đừng gửi.
  - Đọc câu trong khung đỏ, làm theo đúng ca:
    1. "Căn … còn đơn OTM-… đang ở, chưa trả phòng. …" (hoặc "… còn đơn khác đang ở …", không có mã): mở đơn đó. Có mã thì gõ mã vào ô tìm ở **Đơn đặt phòng**; không có mã thì bấm căn trên **Sơ đồ phòng**.
       - Khách cũ đã đi: kiểm căn rồi **Trả phòng** đơn đó (hay gặp nhất). Đơn đã quá ngày đi thì Desk không có nút **Trả phòng**: làm theo mục 11.1, **Đơn quá ngày đi**.
       - Khách cũ còn ở: giữ hành lý, mời khách mới chờ, hoặc **Đổi căn / đổi ngày** cho khách mới sang căn trống (mục 6.1).
    2. "Căn … vẫn hiện có khách, nhưng không còn đơn nào đang ở. …" (đơn trước đã **Đã trả phòng** mà căn vẫn hiện có khách): **không** nhận khách vào căn này. Desk và app nhân viên chưa có nút sửa trạng thái này, chờ 07:00 cũng không tự hết. Xếp khách sang căn trống sẵn sàng khác (**Đổi căn / đổi ngày**; cùng hạng, không có thì nâng hạng, OTTIMO chịu chênh) và **báo quản lý ngay**. Quản lý nhắn đội kỹ thuật số căn và mã đơn trước để sửa trạng thái căn. Không còn căn nào: quản lý gọi đội trong ca, khách chờ ở sảnh, giữ hành lý. **Không** dùng **Khóa phòng** (`OOO`) để đặt lại trạng thái: cách đó ghi sai công suất phòng.
- **Căn khóa sửa chữa** (`OOO`): **không bao giờ** nhận phòng được.
<!-- SEC FB-R4-SEC-BE-PR74-02 (Minor, mã sửa v1.0.5): ngày khách về căn cũ (B14 stayScope until_parent_departure) mà chưa ghi "đã chuyển về" thì căn tạm không có holder, lên VD/CL là mở được ngoại lệ. Desk và app trên main chưa có nút chọn "chuyển tới hết đơn gốc" lẫn nút ghi "đã chuyển về" (roomReturnRecorded chỉ có ở API), nên sổ tay dùng bước kiểm căn thật, không nói "ghi đã chuyển về". Có nút thì BA thêm bước ghi. -->
<!-- BA 05/11: #74 (máy chủ) và #77 kèm #79 (Desk, gộp main c9af9f4c) đã vào v1.0.4. Câu chặn theo UXD lượt 4: OOO → ci.ooo_never; căn còn lượt ở khác → checkin.room_held_code (có mã) hoặc checkin.room_held; OC/OD không còn lượt ở → checkin.room_status_stuck; checkin.room_occupied chỉ hiện khi máy chủ không gửi cause (trước #74). QA2 #77 @ 055e92d5: lượt quá ngày đi + CL cũng ra room_held_code; VD/CL không còn lượt ở giữ ngoại lệ. Đơn chưa gán căn không có câu chặn căn; #84 (BUG-R4-049) bỏ thêm dòng phụ buồng/sức chứa khi chưa gán căn, sổ tay không tả dòng phụ nên không đổi. Ca 2 trong khung đỏ (trước 05/11 là bước (3)) theo DOM lượt 7 mục 3; 05/11 tách theo từng ca theo UXD #72 thẻ 01, thêm Lý do ghi đã kiểm và kiểm mã cũ trên app khóa theo SEC #72 thẻ 02: v1.0.4 không có nút đưa căn khỏi OC (needs_cleaning chưa có giao diện); nút Cần dọn ở backlog v1.0.5 (PO xếp), có nút thì BA thêm lại bước dọn. -->
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
- Khách nước ngoài **gia hạn, trả sớm hoặc trả phòng**: hồ sơ hiện ở tab **Cần cập nhật ngày đi**. Cập nhật trên cổng trong ngày. Trừ đơn quá ngày đi mà khách đã đi (mục 11.1, **Đơn quá ngày đi**, trường hợp (b)): ngày đi trên cổng là ngày khách đi thật, không dán ô ngày đi Desk hiện.
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

> **Lỗi nhỏ đã biết (sửa ở v1.0.4):** câu "Phí phạt không tính vào doanh thu phòng" hiện cả khi chọn giặt ủi. Giặt ủi không phải phí phạt; cứ thêm như thường.

### 9.2 Thêm người đi cùng

1. Khung đơn → mục **Người ở** → **Thêm người đi cùng**.
2. Chọn **Người lớn đi cùng** hoặc **Trẻ em** (trẻ chỉ cần **Năm sinh**). Ô chọn người hiện nhãn "Khách đứng tên" – nhãn nhầm, đang sửa; chọn đúng người đi cùng.
3. Vượt định mức: Desk hiện phụ thu người (từ 6 tuổi trở lên 150.000 đ/đêm, dưới 6 tuổi miễn). Báo khách. Desk hiện 100.000 cho trẻ 6–11 tuổi: báo quản lý, không tự sửa.
4. Tích **Ghi phụ thu … vào folio – tôi đã báo khách** → **Thêm vào đơn**.
5. Desk tự tạo việc cho buồng phòng chuẩn bị bộ đồ dùng thêm.

[ẢNH: C2-24-Thêm người đi cùng]

### 9.3 Gia hạn

1. Khung đơn → **Gia hạn**. Chọn số đêm **Ở thêm** (chỉ đêm còn **Trống**; tối đa 7 đêm liên tiếp).
2. Desk tính tiền. Từ ngày chủ đầu tư chuyển giá không còn giảm theo số đêm: sửa giá đêm thêm thì gõ đúng giá đã chốt với khách.
3. Đơn OTA: phần gia hạn thành đơn con kênh Trực tiếp, chung phiếu thanh toán.
4. Bấm **Gia hạn … đêm · …**. Kéo dài hiệu lực mã cửa trên app khóa. Khách nước ngoài: cập nhật khai báo trong ngày. Trừ đơn quá ngày đi mà khách đã đi (mục 11.1, **Đơn quá ngày đi**, trường hợp (b)): không kéo dài mã, không khai ngày gia hạn lên cổng.
5. Desk chưa có ô thu tiền khi gia hạn và chưa có nút ghi thu giữa kỳ ở. Ghi vào sổ giao ca: mã đơn, số đêm gia hạn, số tiền. Thu ở bước **Bill & thu tiền** khi trả phòng. Khách gia hạn dài hoặc chưa trả các đêm trước: báo quản lý.
6. **Đơn dài hạn nhập tay (HĐ thuê tháng):** **trước khi bấm Gia hạn**, ghi "OTM-…: HĐ kết thúc dd/mm/yyyy, gia hạn tới dd/mm/yyyy" vào **bảng kỳ thu** (dòng của căn) và **sổ giao ca**. Lấy ngày kết thúc từ HĐ giấy. Lý do: Desk dời **Ngày ra (theo HĐ)** sang ngày cuối gia hạn và không giữ ngày kết thúc HĐ (còn ở v1.0.3, sửa ở v1.0.4 – mục 17.5); khi khách rời sớm, lễ tân cần ngày này để chọn nhánh ký quỹ (mục 11.5.3).
   - Ngày ở thêm của đơn HĐ tính theo HĐ: giá ngày = tiền thuê tháng ÷ 30, làm tròn 1.000; phí dịch vụ = 200.000 × số ngày ÷ 30, làm tròn 1.000. Ví dụ tiền thuê 8.500.000, ở thêm 5 ngày: 283.000 × 5 = 1.415.000 + phí dịch vụ 33.000.
   - Desk không ghi dòng tiền cho phần gia hạn của đơn HĐ. Thu và ghi sổ kế toán như tiền thuê (mục 5.4), không thu ở bước **Bill & thu tiền**.
   - **Áp dụng từ v1.0.4** (khi chủ đầu tư báo v1.0.4 đã lên; tới lúc đó làm như trên): Desk **giữ ngày kết thúc HĐ** khi gia hạn và **Trả sớm** chọn nhánh theo ngày này (mục 17.5). Không cần ghi dòng "HĐ kết thúc…" vào sổ giao ca trước khi bấm **Gia hạn** nữa. Bảng kỳ thu vẫn giữ cột **ngày kết thúc HĐ** (theo HĐ giấy), vì khung đơn không hiện ngày này.
7. **Đơn kênh Nội bộ cần ở thêm (áp dụng ngay, tới khi chủ đầu tư báo v1.0.4 đã lên): không bấm Gia hạn.** Desk tính đêm gia hạn của đơn Nội bộ theo giá Trực tiếp thay vì 0 đ, và không cho sửa về 0 (BUG-R4-038, sửa ở v1.0.4). Thay vào đó tạo một đơn Nội bộ mới 0 đ cho các đêm thêm. **Từ v1.0.4:** bấm **Gia hạn** như đơn khác; Desk ghi đêm thêm của đơn Nội bộ 0 đ (gõ giá > 0 nếu có thu).
   - **Tạo đơn nối tiếp** (mục 5.1): cùng căn, **Ngày đến** là ngày đi của đơn đang ở, **Ngày đi** là ngày đi mới, kênh **Nội bộ**, cùng người đứng tên và số khách. Ô **Ghi chú nội bộ**: "Ở tiếp OTM-… (thay Gia hạn)". Ngay trước khi bấm **Tạo đơn**, **xóa trống mọi ô Giá mỗi đêm** (không gõ 0 – Desk báo lỗi). Mở hộp từ **Sơ đồ phòng** thì Desk điền sẵn giá Trực tiếp, và chuyển sang **Nội bộ** vẫn giữ các số đó (BUG-R4-037). Tạo xong, mở khung đơn: mục **Folio** phải ghi **Tiền phòng (… đêm) 0** và **Còn phải thu 0**. Khác 0: **Hủy đơn** vừa tạo (chưa nhận phòng, chưa thu tiền), tạo lại đúng cách trên. Ghi sổ giao ca: "OTM-… ở tiếp bằng đơn OTM-…, tới dd/mm".
   - **Căn không còn trống từ ngày đi** (Desk báo kín dưới ô ngày): tạo đơn nối tiếp ở một căn khác còn trống. Người ở chuyển căn vào ngày đi của đơn cũ: trả phòng đơn cũ như thường (thu thẻ, xóa mã căn cũ), nhận phòng đơn mới và giao mã căn mới. Căn chỉ trống một phần các đêm: tạo đơn cho các đêm còn trống. Không còn căn nào trống: báo quản lý.
   - **Vào ngày đi của đơn cũ, trước 18:00 (nên làm đầu ca sáng, trước 12:00):** **Trả phòng** đơn cũ trước (mục 11.1), rồi mới **Nhận phòng** đơn mới. Desk chỉ cho nhận phòng đơn mới từ ngày đến của đơn đó. **Không** nhận phòng đơn mới khi đơn cũ còn **Đang ở**, kể cả bằng xác nhận ngoại lệ buồng chưa sẵn sàng. Trả phòng sau 18:00 thì Desk tính phụ thu bằng một đêm giá Trực tiếp (cùng lỗi).
   - **Trả phòng đơn cũ khi ở tiếp cùng căn:** người ở không đi. Không thu thẻ, không xóa mã cửa: kéo dài hiệu lực mã tới ngày đi mới trên app khóa. Hộp **Hoàn tất trả phòng** có câu "xóa mã trên app khóa": khi ở tiếp cùng căn thì **không** xóa. Minibar, phát sinh làm như thường. Desk chuyển căn sang **Trống, cần dọn** và tạo việc dọn: báo buồng phòng người ở vẫn ở, dọn như căn đang có khách. Buồng phòng có thể thấy 2 việc dọn cho căn này (dọn trả phòng, dọn gấp): dọn **một lần** như căn có khách, rồi bấm xong cả hai.
   - **Nhận phòng đơn mới:** đủ các bước như mục 7.3. Giấy tờ không mang từ đơn cũ sang: nhập lại giấy tờ người ở. Khai báo theo bước **Khai báo** (mục 8.3). Căn đang **Trống, cần dọn** nên dòng **Buồng sẵn sàng** báo **Còn thiếu**: lễ tân bấm **Gửi lễ tân trưởng xác nhận**, lý do "Ở tiếp OTM-…, cùng người"; lễ tân trưởng tự xác nhận được (mục 7.4). Buồng phòng đã dọn xong (căn `VC` hoặc `VI`) trước lúc nhận phòng thì nhận như thường, không cần lễ tân trưởng. Cùng căn thì dùng mã cửa đã kéo dài. Người ở vắng lúc trả phòng đơn cũ: vẫn trả phòng đơn cũ buổi sáng; nhận phòng đơn mới khi người ở về với giấy tờ, trong ngày, và ghi sổ giao ca trong khoảng giữa.
   - **Đã lỡ bấm Gia hạn đơn Nội bộ:** không thu tiền người ở; báo quản lý trước khi trả phòng. Desk chưa có cách gỡ; đội kỹ thuật sẽ báo cách gỡ khi sửa.

[ẢNH: C2-25-Gia hạn]

### 9.4 Đổi phòng khi đang ở

1. Khung đơn → **Đổi phòng**.
2. **Vì sao đổi?**: **Sự cố của OTTIMO – giữ giá cũ** hoặc **Khách yêu cầu – giá căn mới**. Ghi **Lý do đổi**.
3. **Trước khi chọn căn mới**, mở **Buồng phòng** hoặc **Sơ đồ phòng** kiểm căn đó đang `VC` hoặc `VI` (lỗi đang sửa: danh sách có thể lẫn căn chưa dọn `VD`; chọn căn đó thì Desk báo và không lưu gì). Không đổi khách sang căn `VD`.
4. **Căn mới (đã dọn hoặc đã kiểm)**: chọn căn. Căn nhóm cao hơn cần lễ tân trưởng xác nhận.
5. Bấm **Đổi sang căn …** khi khách đã sẵn sàng chuyển. Rồi:
   - Nhờ buồng phòng đếm minibar căn cũ **ngay, trước khi dọn**, báo **số còn lại từng món**. Ghi sổ giao ca: "OTM-… đổi 202 → 203 lúc hh:mm dd/mm – minibar 202 còn: Bia Đà Lạt 0/2, snack 1/1 (người đếm)". Không ghi tên khách. **Không** ghi minibar căn cũ bằng **Thêm phát sinh**: lúc trả phòng, Desk hỏi tủ căn cũ và tính tiền một lần (mục 11.1 bước 2). Báo buồng phòng **bổ sung đủ tủ căn cũ** khi dọn, trước khi căn đó nhận khách mới.
   - Thu thẻ căn cũ, ghi số thẻ trả. **Xóa mã căn cũ trên app khóa.** Giao mã/thẻ căn mới.
   - Bộ đồ dùng thêm: Desk tự tạo việc chuyển. Căn cũ có việc dọn: buồng phòng chỉ dọn khi khách đã ra hết đồ.
   - Đổi do sự cố: khách giữ giá cũ. Muốn bù thêm thì dùng miễn phí, lý do **Bù sự cố**.

[ẢNH: C2-26-Đổi phòng]

### 9.5 Miễn phí, giảm giá

1. Trong folio (**Folio & điều chỉnh**), ở dòng cần miễn: **Mở form miễn phí / giảm giá**. Hộp **Miễn phí · <dòng> · <số tiền>** mở ra.
2. Dòng phát sinh: Desk để miễn phí (FOC). Dòng tiền phòng: có ô **Loại**, mặc định **Miễn khoản phát sinh (FOC)** – chọn **Giảm giá đặc biệt (tiền phòng)**, trừ đêm bù sự cố của OTTIMO (để FOC, lý do **Bù sự cố**).
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

Từ 02/11 tới bản v1.0.3, khách chưa có link trang khách (mục 17.3), nên yêu cầu chủ yếu tới qua Zalo hoặc điện thoại.

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

1. **Hôm nay → Khách đi → Trả phòng** (hoặc khung đơn → **Trả phòng**). Desk mở **Trả phòng · Căn … · …**. Khách đã đổi căn giữa kỳ: **trước khi bấm**, mở **Folio** kiểm trùng minibar căn cũ (gạch **Kiểm trùng** dưới **Bước 1 – Minibar**).
2. **Bước 1 – Minibar.** Nhập số **Còn lại / chuẩn** từng món theo số buồng phòng đếm. Không dùng gì: **Không dùng gì – tủ đủ**. Buồng phòng chưa báo số: hỏi khách đã dùng gì, nhập theo lời khách, ghi chú "chưa đếm". **Không** bấm **Không dùng gì – tủ đủ** khi chưa có số. Xem **Tổng minibar**. Bấm **Tiếp tục: Phụ phí**.
   - **Khách đã đổi căn giữa kỳ, có 2 tủ minibar – từ v1.0.4:**
     - Bước **Minibar** có dòng **Tủ minibar cần đếm**, mỗi tủ một nút: **Căn … (đã chuyển đi)** đứng trước, **Căn … (đang ở)** đứng sau. Desk mở sẵn tủ căn cũ: **nhập số còn lại đã ghi lúc đổi phòng** (sổ giao ca). **Không** đếm lại tủ căn cũ lúc trả phòng: tủ đó đã dọn, đã bổ sung, có thể đã có khách khác. Sổ giao ca không có số: hỏi buồng phòng. Vẫn không có: hỏi khách đã dùng gì ở căn cũ, nhập theo lời khách, ghi chú "chưa đếm", báo quản lý. Tủ căn đang ở: đếm như thường.
     - **Kiểm trùng, trước khi bấm Trả phòng:**
       - Mở **Folio** của đơn. Tìm dòng **Thêm phát sinh** ghi minibar căn cũ lúc đổi phòng (cách cũ, thường là **Đồ ăn uống**).
       - Có dòng đó: **Bỏ cả dòng** (**Folio & điều chỉnh** → dòng đó → **Điều chỉnh** → **Bỏ cả dòng**), **Lý do điều chỉnh** "Trùng minibar tủ căn cũ" → **Ghi điều chỉnh**, rồi vẫn nhập số tủ căn cũ ở bước **Minibar**. Trang **Trả phòng** không có nút sửa dòng folio. Lễ tân trở lên bỏ được khi chưa hoàn tất trả phòng. Desk không cho bỏ thì báo quản lý.
       - **Chỉ** bỏ dòng **Thêm phát sinh** ghi minibar căn cũ lúc đổi phòng: ghi chú của dòng hoặc sổ giao ca cho thấy đúng tủ căn cũ, cùng số tiền. **Không** dùng **Bỏ cả dòng** để miễn hay giảm cho khách: miễn, giảm luôn làm theo mục 9.5.
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
     - Lỡ bị đảo (Folio có khoản minibar và một dòng trừ đúng số đó): Desk không cho **Điều chỉnh** dòng đã đảo. Khách còn ở quầy: **Thêm phát sinh** → **Khoản**: **Đồ ăn uống**, nhập đúng số tiền đã mất, **Ghi chú** "Minibar tủ căn …: món × số" → **Thêm vào folio** (mục 9.1), rồi thu như thường. Khách đã đi: báo quản lý, quản lý quyết thu lại hay bỏ qua. Cả hai trường hợp: ghi sổ giao ca (mã đơn, số tiền) và báo buồng phòng kiểm, bổ sung tủ đó, vì Desk đã ghi tủ đủ.
3. **Bước 2 – Phụ phí.** Kiểm **Giờ trả phòng thực tế**. Desk tự tính phụ thu trả muộn (mục 11.3). Thêm **Phát sinh khác** nếu có (**Giặt ủi**, **Đồ ăn gọi thêm**, **Hư hỏng, mất đồ**, **Khử mùi thuốc lá**, **Thiếu thẻ phòng**). Có phụ thu: báo khách, tích **Tôi đã báo khách khoản phụ thu này**. Bấm **Tiếp tục: Bill & thu tiền**.
4. **Bước 3 – Bill & thu tiền.** Đọc **Tổng cộng**, **Đã thu**, **Còn phải thu**. Thu theo mục 10.
5. Khách lấy hóa đơn công ty: bật **Khách lấy hóa đơn công ty** → **Tên công ty**, **Mã số thuế**, **Địa chỉ công ty**, **Email nhận hóa đơn** → bấm **Lưu** (mục 11.7). Bỏ qua dòng chữ nhỏ nhắc "Round 3 / R2" dưới ô – chữ cũ, đang sửa.
6. Khách trả thừa: Desk hiện "Khách đã trả thừa … đ. Chọn cách xử lý." Chọn **Hoàn lại khách … (tạo đề nghị hoàn)** hoặc **Khách đồng ý để lại khoản thừa – chỉ quản lý trở lên**, ghi lý do.
   - Số Desk hiện chỉ là phần **chưa có** yêu cầu hoàn. Khoản hoàn của **Trả sớm** không hiện lại, không tạo lại.
   - Chọn hoàn thì đơn có **thêm một** đề nghị hoàn cho đúng phần này, không trùng. Ghi trong lý do phần này từ đâu (ví dụ "đêm 05/11 đã thu, được FOC") để người duyệt đối chiếu.
   - Desk tạo đề nghị hoàn khi bấm hoàn tất (bước 7). Xong bước 8, nhập nơi nhận hoàn ngay khi khách còn ở quầy (mục 12.2), trên máy đã cấp quyền. Đơn còn khoản **Trả sớm** chưa chi: báo khách tổng số hoàn và số lần chuyển, ví dụ "You will receive 1,200,000 VND back in two transfers: 400,000 and 800,000 VND." / "OTTIMO sẽ hoàn anh/chị 1.200.000 đ, chuyển làm hai lần: 400.000 đ và 800.000 đ." Số của khoản Trả sớm: **từ v1.0.4** ở dòng **Đang chờ hoàn** dưới **Còn phải thu** (mục 11.5.2); ở v1.0.3 ở **Nhật ký tiền → Hoàn tiền**, dòng của mã đơn (chỉ yêu cầu do chính anh/chị tạo hoặc đã được duyệt). Người khác bấm **Trả sớm** (ví dụ ca trước) mà yêu cầu còn chờ duyệt thì **không hiện ở cả hai chỗ**: hỏi quản lý (hoặc chủ đầu tư) trước khi báo khách.
   - **Đơn HĐ thuê tháng** (dài hạn nhập tay): Desk báo trả thừa thì **không** chọn **Hoàn lại khách**, chưa hoàn tất. Dừng, hỏi chủ đầu tư (gửi mã đơn và số Desk hiện). Tiền thuê và ký quỹ xử lý ngoài app (mục 11.5.3, 5.4).
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

**Đơn quá ngày đi, vẫn Đang ở** (ngày đi đã qua mà chưa bấm **Trả phòng**): Desk chỉ cho **Trả phòng** đúng ngày đi của đơn, nên khung đơn và **Hôm nay** không có nút **Trả phòng**. Làm như sau:
1. Kiểm căn và hỏi buồng phòng: khách còn ở hay đã đi, đi ngày nào. Khách đã đi (trường hợp (b) bên dưới): **xóa mã cửa** của khách trên app khóa ngay, không chờ duyệt; ghi sổ giao ca.
2. Khung đơn → **Gia hạn** tới hôm nay: **Ở thêm** từ ngày đi trên đơn tới hôm nay (mục 9.3). Desk báo đêm đó đã kín, hoặc cần quá 7 đêm: dừng, báo quản lý.
   - Kiểm dòng **Ngày đi đổi thành …** là ngày hôm nay. Trước 06:00, "hôm nay" là ngày hôm qua theo lịch. Ví dụ 04:30 ngày 25/11, ngày đi 23/11: **Ở thêm** 1 đêm, ngày đi đổi thành 24/11.
   - Khách đã đi (trường hợp (b)): **không** kéo dài mã cửa (bỏ câu kéo dài mã ở mục 9.3 bước 4). Desk báo thị thực hết trước ngày đi mới: ghi lý do "Gia hạn để trả phòng, khách đi ngày …".
3. Chọn đúng trường hợp, rồi **Trả phòng** như các bước trên:
   - **(a) Khách ở thật quá ngày đi:** đêm thêm là đêm bán, thu như gia hạn thường (Trực tiếp, CTV theo giá đêm của đơn; OTA thành đơn con Trực tiếp). **Giờ trả phòng thực tế** là giờ khách rời thật (Desk đòi **Ghi chú giờ trả (vì sao ghi bù)** thì ghi lý do); phụ thu trả muộn hôm nay tính như mục 11.3. Khách đã rời mà chưa trả đủ: dừng, gọi quản lý ghi công nợ.
   - **(b) Khách đã đi đúng ngày, lễ tân quên bấm Trả phòng** (hay gặp hơn): không thu đêm thêm. Làm theo thứ tự:
     1. **Xin giảm từng đêm thêm.** Trong **Folio & điều chỉnh**, ở từng dòng tiền phòng của đêm thêm: **Mở form miễn phí / giảm giá** → **Loại**: chọn **Giảm giá đặc biệt (tiền phòng)** (Desk chọn sẵn **Miễn khoản phát sinh (FOC)**, phải đổi) → **Số tiền miễn**: để nguyên số Desk điền (cả dòng) → **Lý do miễn phí**: **Khác (ghi rõ)**, ghi "Quên bấm Trả phòng, khách đi ngày …" → **Gửi duyệt** (mục 9.5).
     2. **Chờ duyệt.** Quản lý hoặc chủ đầu tư duyệt. Còn chờ thì Desk chưa cho hoàn tất trả phòng. Khách của căn này đang chờ: gọi quản lý duyệt ngay, không chỉ chờ thông báo. Chờ lâu thì **Đổi căn / đổi ngày** cho khách mới sang căn trống sẵn sàng (mục 6.1).
     3. **Trả phòng.** **Giờ trả phòng thực tế**: trước 12:00 thì để nguyên giờ Desk điền sẵn (Desk không nhận giờ muộn hơn lúc bấm); từ 12:00 trở đi thì gõ 12:00. Không phụ thu. Desk đòi **Ghi chú giờ trả (vì sao ghi bù)** (giờ ghi sớm hơn lúc bấm) thì ghi "Quên bấm Trả phòng, khách đi ngày …" rồi hoàn tất lại. Hộp hoàn tất nhắc xóa mã: mở app khóa, còn mã của lượt này thì xóa.
     4. **Khai báo, khách nước ngoài:** **không** cập nhật ngày đi mới lên cổng khai báo lưu trú, dù hộp **Gia hạn** nhắc. Ngày khách rời là ngày đi trên đơn cũ: cổng chưa ghi thì ghi ngày đó (gõ tay), và ghi sổ giao ca là ghi trễ. Hồ sơ sẽ hiện ở tab **Cần cập nhật ngày đi**; ô ngày đi ở khối **Sao chép lên cổng khai báo** lúc này là ngày gia hạn: **không** dán ô đó. Hạn và cách ghi trễ trên cổng: hỏi quản lý trước khi gửi.
     5. Ghi sổ giao ca: mã đơn, ngày khách đi, số đêm đã gia hạn và xin giảm.
   - Đơn **Nội bộ**: từ v1.0.4 đêm thêm đã 0 đ, không cần xin giảm. Tới v1.0.3, Gia hạn đơn Nội bộ ra giá Trực tiếp (mục 9.3 bước 7): báo quản lý trước khi gia hạn.
   - Ví dụ: đơn Trực tiếp 800.000 đ/đêm, ngày đi 23/11, 10:00 ngày 24/11 vẫn **Đang ở**. Gia hạn 1 đêm tới 24/11. Trường hợp (a) thu thêm 800.000 đ; trường hợp (b) thu thêm 0 đ.
<!-- DOM lượt 8 (BR-421, BR-402 v0.5.7): B18 chỉ chạy đúng ngày đi của đơn. Gia hạn có ở mọi đơn Đang ở: allowed-actions.ts cho extend_stay (B13) không theo ngày, check_out (B18) chỉ khi hôm nay là ngày đi. QA TC-V104-RG-26 (05/11): B18 thẳng ra 409 INVALID_TRANSITION; B13 rồi B18 sau 12:00 đòi quyết phụ thu trả muộn; B18 giờ gõ trước 12:00 kèm checkoutTimeNote ra 200. Giờ muộn hơn lúc bấm: 422 TIME_AFTER_ACTION (checkTypedTime), nên (b) trước 12:00 để giờ Desk điền. v1.0.5 đề xuất Trả phòng theo ngày khách thật sự đi (PO/ARC). -->

> **Lỗi nhỏ đã biết (v1.0.3 hoặc v1.0.4):** các nút nhanh ở bước **Phụ phí** (giặt ủi, F&B, hút thuốc, mất thẻ) mở hộp nhưng **chưa chọn sẵn khoản**: chọn tay khoản trong ô **Khoản**. Khung đơn đang ở hiện dòng "Còn phải thu" hai lần, cùng một số.

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

### 11.5 Khách trả phòng sớm (từ v1.0.2)

**Áp dụng từ khi chủ đầu tư báo bản v1.0.2 đã lên.** Từ bản này khung đơn đang ở có nút **Trả sớm** (lễ tân trở lên), cho cả đơn ngắn ngày và đơn dài hạn nhập tay. Bỏ cách tạm cũ "để căn **Đang ở** tới ngày đi rồi quản lý giảm tiền trên folio". Vẫn **không mở màn Trả phòng trước ngày đi**: dùng **Trả sớm**.

Ba điều luôn giữ: **không hứa số hoàn**, **không hoàn tiền tại quầy**, ghi giờ khách báo ngay (giờ báo quyết định tiền hoàn của đơn ngắn ngày).

<!-- Nguồn: Desk v1.0.2 (PR #22, nhánh v1.0.2-ed @ 9d4f0fa8, EarlyDepartureDialog.tsx, chuỗi early_departure.*); BR-428, BR-313 v0.5.1, BR-207, BR-210, BR-214, BR-502; ESC-048 = B (03/11); DOM-on-PR22-BUG-R4-014.md Lượt 2 (ranh giới B/C, FB-05 ý 1–9); ORC 03/11: bỏ nhánh "HĐ ký trước 01/11/2026" (không có HĐ giấy cũ). Chữ khung HĐ theo FE-A sau UXD thẻ 26–31: strings-vi.json @ 52702857 (PR #22), khóa lease_title, lease_check, lease_done_note, lease_rule_paid, lease_rule, lease_rule_no_amount, lease_still_due, told_guest_lease; lease_rule_old đã gỡ. -->

**Bước 0 – Chọn nhánh**

| Đơn | Ngày rời | Làm theo |
|---|---|---|
| Đơn ngắn ngày (Trực tiếp, CTV, OTA), mọi số đêm | Trước ngày đi | Thao tác chung (11.5.1) + **nhánh ngắn ngày** (11.5.2) |
| Đơn dài hạn nhập tay (cờ **HĐ ngoài hệ thống – sẽ chuyển vào app**) | **Trước ngày kết thúc ghi trên HĐ giấy** | Thao tác chung (11.5.1) + **nhánh HĐ thuê tháng** (11.5.3) |
| Đơn dài hạn nhập tay đã gia hạn, khách đã ở hết HĐ | Trong phần gia hạn | Mục 11.5.4 |

Ngày kết thúc HĐ lấy từ **HĐ giấy** hoặc cột ngày kết thúc HĐ trong bảng kỳ thu (mục 5.4). Đơn đã gia hạn bằng **Gia hạn**: **không** dựa vào **Ngày ra** trên Desk, vì Desk đã dời ngày này sang ngày cuối gia hạn (mục 9.3, 17.5). Từ v1.0.4 **Trả sớm** tự chọn nhánh theo ngày kết thúc HĐ Desk giữ, nhưng **Ngày ra** trên khung đơn vẫn là ngày cuối gia hạn.

#### 11.5.1 Thao tác nút Trả sớm (mọi đơn)

1. Khách báo rời sớm (Zalo, điện thoại, tại quầy): ghi ngay vào **sổ giao ca** "OTM-…: khách báo rời ngày dd/mm lúc hh:mm, báo qua (Zalo/điện thoại/tại quầy)". Không ghi tên khách.
2. Mở đơn → **Trả sớm**. Hộp **Trả sớm · Căn … · …** có 3 bước: **Ngày rời và giờ báo** → **Xem trước** → **Kết quả**.
3. Bước **Ngày rời và giờ báo**:
   - **Ngày rời mới**: chọn trong khoảng Desk ghi dưới ô. Các đêm từ ngày này trở đi được mở bán lại.
   - **Trả sớm lúc 00:00–05:59** (áp dụng ngay; Desk chưa chặn, sửa ở v1.0.5): ô **Ngày rời mới** đặt sẵn **ngày hôm trước**, vì tới 06:00 Desk vẫn tính là ngày cũ. Đêm vừa qua là đêm khách **đã ở**, không phải đêm bỏ. Đổi **Ngày rời mới** thành **ngày lịch hôm nay** rồi mới bấm **Xem trước số tiền**. Số ngày báo trước vẫn đếm theo quy tắc thường: ví dụ khách báo 04:30 ngày 03/11, rời 03/11 là báo trước 1 ngày. Bước **Kết quả** sẽ không có **Trả phòng ngay** (Desk ghi "Khách trả phòng ngày … như thường lệ").
   - **Khách đi trước 06:00** (áp dụng ngay, cả khi rời đúng ngày đi ghi trên đơn): nút **Trả phòng** (khung đơn, trang **Hôm nay**) chỉ hiện **từ 06:00**. Lúc khách đi: đóng hộp; thu thẻ, chìa khóa, xóa mã cửa; đếm minibar nếu kịp. Xem **Còn phải thu** ở khung đơn, cộng minibar vừa đếm, rồi **thu ngay trước khi khách đi**: tiền mặt (cất két, để riêng) hoặc thẻ qua máy POS (giữ phiếu POS), như mục 10.1. Lúc này Desk chưa ghi được khoản thu và chưa có mã VietQR. Khách chỉ chuyển khoản được: ghi sổ giao ca số còn thu, đầu ca sáng báo quản lý. Báo khách số sẽ hoàn (nếu có) như mục 11.1. Ghi sổ giao ca "OTM-… khách rời hh:mm, đã thu … bằng …, chờ Trả phòng lúc 06:00". **Không** bấm **Trả sớm** lần nữa, không gọi quản lý chỉ vì chưa có nút. **Từ 06:00** (hoặc đầu ca sáng, **trước 12:00**): khung đơn → **Trả phòng**. Ở bước **Phụ phí**, **để nguyên giờ Desk điền sẵn** ở ô **Giờ trả phòng thực tế** (giờ hiện tại). **Không** gõ giờ trước 06:00 (ví dụ 04:30): Desk sẽ hiện hộp thêm đêm rồi báo giờ sai, không hoàn tất được (lỗi đã biết, đang sửa). Trả phòng trước 12:00 thì Desk không phụ thu, không thêm đêm, nên số tiền vẫn đúng. Quá 12:00 mới làm được: gõ **12:00** ở **Giờ trả phòng thực tế** (không gõ giờ trước 06:00). Desk đòi **Ghi chú giờ trả (vì sao ghi bù)** thì ghi "Khách rời hh:mm, trả phòng trên Desk lúc hh:mm" rồi hoàn tất lại. Không phụ thu. Ở bước **Bill & thu tiền**, ghi khoản đã thu lúc khách đi theo đúng cách đã thu: tiền mặt thì nhập số tiền ở **Tiền khách đưa**; thẻ thì nhập **Mã chuẩn chi trên phiếu POS**. Giờ khách rời thật ghi ở sổ giao ca, không ở Desk: hoàn tất xong, ghi tiếp "OTM-… Trả phòng trên Desk lúc 06:xx, khách rời thật hh:mm". Khách rời đúng ngày đi ghi trên đơn: không dùng **Trả sớm**, làm **Trả phòng** từ 06:00 như trên.
   - **Khách báo lúc** (**Ngày**, **Giờ**): Desk điền sẵn lúc mở hộp. Khách đã báo sớm hơn (tin nhắn, cuộc gọi): sửa đúng giờ khách báo. Khi đó Desk hiện **Bằng chứng giờ báo**: ghi **Khách báo qua đâu, lúc nào** (ví dụ "Zalo 21/10 09:40, khách xin rời 22/10"); **Ảnh tin nhắn của khách** không bắt buộc, chỉ chụp phần tin nhắn.
   - Đơn OTA: nhập **Số OTA giữ lại** theo extranet của kênh; ghi 0 nếu OTA hoàn đủ cho khách.
   - Bấm **Xem trước số tiền**.
4. Bước **Xem trước**: Desk hỏi "Trả sớm cho …, rời …?" và ghi "Số do máy chủ tính. Chưa ghi gì." Đọc theo nhánh ở 11.5.2 hoặc 11.5.3, báo khách, rồi tích ô "Đã báo khách…" và bấm **Xác nhận trả sớm**. Desk báo "Số tiền vừa thay đổi…": đọc số mới, báo lại khách, tích lại.
5. Bước **Kết quả**: "Đã ghi trả sớm – khách rời dd/mm".
   - Ngày rời là hôm nay: bấm **Trả phòng ngay**, làm trả phòng 3 bước (mục 11.1).
   - Ngày rời là ngày sau: đóng hộp. Nút **Trả phòng** hiện vào ngày đó; hôm đó bấm **Trả phòng** như thường (giờ trả là giờ bấm, không ghi lùi).
6. Việc ngoài Desk (hộp liệt kê ở mục **Sau khi xác nhận**):
   - App khóa: rút hiệu lực mã cửa về giờ trả phòng ngày rời; khi khách trả phòng thì **xóa mã ngay**.
   - Khi khách rời: thu thẻ (ghi số thẻ trả), nhờ buồng phòng đếm minibar, kiểm hư hỏng. Món đã dùng và hư hỏng: **Thêm phát sinh** vào folio.
   - Khách nước ngoài: cập nhật ngày đi trên cổng khai báo **trong ngày khách rời**. Desk nhắc ở bước **Kết quả** và có nút **Mở danh sách cần cập nhật**.
   - Extranet: Desk ghi "Mở lại các đêm này trên extranet OTA" cho **mọi** đơn. Mở lại các đêm khách bỏ trên extranet **mọi kênh đang đóng căn này** (đơn OTA: kiểm cả kênh của đơn lẫn các kênh đã đóng theo mục 5.3). Desk chưa tự mở. Chỉ người chủ đầu tư giao mới mở phòng trên extranet.
   - Buồng phòng: mở **Vận hành → Buồng phòng**, xem việc của căn. Việc dọn các ngày sau ngày rời còn thì **Hủy việc**, **Lý do**: **Lý do khác**, **Ghi chú** "Khách đã rời sớm". Chưa có việc **Dọn trả phòng** ngày rời thì tạo **Việc mới → Dọn trả phòng** (mục 13.2).

[ẢNH: G2-08-Hộp Trả sớm, bước Xem trước]

#### 11.5.2 Nhánh ngắn ngày

Desk tính tiền theo chính sách trả sớm; lễ tân không tự tính.
- Đơn Trực tiếp/CTV báo trước **từ 1 ngày**: hoàn **50 %** tiền phòng các đêm chưa ở; phụ thu người của các đêm đó hoàn 100 %. Báo **trong ngày rời**: không hoàn. Desk ghi **Báo trước N ngày** dưới ô giờ báo.
- Đơn OTA: tiền phòng theo kênh (số OTA giữ lại anh/chị đã nhập).
- Bước **Xem trước** có bảng **Đêm mở bán lại**, mục **Cách tính** (**Phí trả phòng sớm (ghi vào folio)**, **Sẽ xin hoàn cho khách**). Báo khách đúng số Desk hiện, tích **Đã báo khách số hoàn và phí trả phòng sớm**.
- Có khoản hoàn: Desk tạo **một** yêu cầu hoàn cho phần trả sớm, cần quản lý duyệt. **Nhập nơi nhận hoàn** ngay trên máy quầy đã cấp quyền (mục 12.2). Chủ đầu tư duyệt và chi (mục 17.4).
- Trả phòng sau đó **không tạo lại** khoản này. Folio còn tiền khách trả thừa **khác** (ví dụ đêm đã thu rồi được FOC): bước **Bill & thu tiền** hỏi cách xử lý **đúng phần đó**. Chọn hoàn thì có **thêm một** đề nghị hoàn, không trùng (mục 11.1 bước 6).
- Yêu cầu Trả sớm có thể bị Desk tự đóng ("Yêu cầu không còn cần duyệt nên đã tự đóng."), kể cả khi đã duyệt mà chưa chi, và thay bằng **một** yêu cầu mới đúng số còn nợ khách. Ở **Nhật ký tiền → Hoàn tiền**, yêu cầu mới vẫn ghi anh/chị gửi, số khác số Trả sớm, giờ gửi là lúc Desk tự đóng, không ghi lý do. Đó là yêu cầu thay thế, không phải yêu cầu lạ. Ở v1.0.3, yêu cầu thay thế **không mang nơi nhận** của yêu cầu cũ: kiểm **Cách hoàn** của dòng mới, trống (—) thì **Nhập nơi nhận hoàn** lại (mục 12.2), nhất là khoản hoàn tiền mặt. **Áp dụng từ v1.0.4:** yêu cầu thay thế **giữ nơi nhận** của yêu cầu cũ nếu các yêu cầu cũ chỉ có một nơi nhận, do một người nhập (yêu cầu cũ không có nơi nhận thì không tính); vẫn kiểm **Cách hoàn** trước khi duyệt. Yêu cầu cũ có 2 nơi nhận khác nhau, hoặc do 2 người khác nhau nhập: dòng mới trống (—), **Nhập nơi nhận hoàn** lại. Yêu cầu thay thế tạo **trước** ngày v1.0.4 lên vẫn trống. Yêu cầu cũ đã duyệt thì yêu cầu mới vẫn **Chờ duyệt** (duyệt không mang sang). Nhật ký thao tác tiền có thêm dòng **Chép nơi nhận hoàn sang yêu cầu thay thế**: Desk tự làm, bình thường. **Cách hoàn** mang sang là **Tiền mặt** mà khách đã về, hoặc khách báo đổi tài khoản: liên hệ khách 1–1, đổi nơi nhận ở dòng mới theo mục 12.2, ghi sổ giao ca để chủ đầu tư không duyệt theo nơi nhận cũ. Nhật ký thao tác tiền có thể ghi lý do bằng mã `overpayment` (lỗi chữ, sửa ở v1.0.4).
- Desk ghi "Khách chưa trả thừa nên không có khoản hoàn…": phần hoàn chỉ làm giảm số khách đang nợ, không trả ra bằng tiền.
- **Áp dụng từ v1.0.4** (khi chủ đầu tư báo v1.0.4 đã lên): ở **Trả phòng**, bước **Bill & thu tiền** và màn kết quả, dưới **Còn phải thu**, Desk hiện "Đang chờ hoàn cho khách {số tiền} (yêu cầu từ Trả sớm)." Đó là số OTTIMO còn hoàn khách từ yêu cầu Trả sớm chưa chi xong. Dòng này chỉ để báo, không chặn **Hoàn tất**. **Giới hạn đã biết của v1.0.4:** lễ tân và lễ tân trưởng chỉ thấy yêu cầu hoàn chờ duyệt do **chính mình** tạo. Yêu cầu do người khác tạo (ví dụ ca trước bấm **Trả sớm**) mà còn chờ duyệt thì **không hiện**, cả ở dòng này lẫn ở **Nhật ký tiền → Hoàn tiền**. Yêu cầu đã được quản lý duyệt thì vẫn thấy như thường. Khách đã Trả sớm mà không thấy dòng, hoặc không chắc: **hỏi quản lý (hoặc chủ đầu tư) trước khi báo khách** số tiền hoàn. Không báo khách "không có khoản hoàn". v1.0.5 (chưa có ngày): trang **Trả phòng** và folio hiện **tổng số đang chờ hoàn** của đơn, kể cả yêu cầu do người khác tạo (chỉ số tiền). Tab **Hoàn tiền** giữ phạm vi như hiện nay.

Ví dụ (từ ngày chủ đầu tư chuyển giá): đơn căn 202 từ 9/11 đến 16/11, 7 × 800.000 = 5.600.000 đ. Ngày 12/11 khách báo sẽ rời 14/11 (báo trước 2 ngày). Hai đêm bỏ (14/11, 15/11) 2 × 800.000 = 1.600.000 đ → hoàn **800.000 đ** (50 %), phí trả phòng sớm **800.000 đ**. Không còn giảm theo số đêm, nên không có mức giảm nào phải tính lại.

> **Lỗi nhỏ đã biết (đang sửa):** ở bước **Xem trước**, dưới **Sẽ xin hoàn cho khách** Desk ghi "Trả phòng sau đó không tạo thêm yêu cầu." Câu này thiếu ngoại lệ ở trên. Làm theo tệp này.

#### 11.5.3 Nhánh HĐ thuê tháng (đơn dài hạn nhập tay)

Với đơn HĐ, bước **Xem trước** **không** có bảng tiền, số ngày báo trước, phí hay khoản hoàn. Thay vào đó Desk hiện khung **Trả trước hạn hợp đồng thuê tháng** theo thứ tự:
1. Câu kiểm: "Desk chưa biết tiền thuê đã thu tới đâu. Kiểm kỳ thu cuối và hỏi quản lý rồi mới báo khách."
2. Nhánh đã thu đủ: "Đã thu tiền thuê tới hết HĐ: không vi phạm. Quyết toán ký quỹ như trả phòng đúng hạn HĐ: trừ điện nước, dọn lẻ, hư hỏng còn nợ, hoàn phần còn lại trong 7 ngày làm việc. Không hoàn các ngày không ở."
3. Nhánh chưa thu đủ: "Chưa thu đủ tiền thuê tới hết HĐ: vi phạm HĐ. Khách mất toàn bộ ký quỹ (giữ ngoài app), không truy thu giảm giá kỳ hạn." (Desk có số ký quỹ của đơn thì câu ghi "mất toàn bộ ký quỹ [số tiền] (giữ ngoài app)"). Ý con lồng dưới nhánh này: "Vẫn thu điện nước, dọn lẻ, hư hỏng còn nợ, không trừ vào ký quỹ. Tiền thuê và phí dịch vụ đã thu cho tháng lịch chưa bắt đầu thì hoàn, tháng đang ở thì không (làm ngoài app)."

Ô tích ở cuối: **Đã báo khách về ký quỹ và các khoản còn thu, còn hoàn**.

Ở bước **Kết quả**, khung giữ hai nhánh để tra lại; câu kiểm đổi thành "Ký quỹ và tiền thuê xử lý ngoài app, theo nhánh đã báo khách."

[ẢNH: G2-09-Khung Trả trước hạn hợp đồng thuê tháng]

Desk **không biết** tiền thuê tới hết HĐ đã thu chưa, nên **không đọc khung rồi báo khách ngay**. Làm đủ 4 bước:

**B1 – Kiểm ngày kết thúc HĐ** trên HĐ giấy (hoặc bảng kỳ thu). Ngày rời từ ngày kết thúc HĐ trở đi: sang mục 11.5.4.

**B2 – Kiểm kỳ thu cuối** trong bảng kỳ thu (sổ thu ngoài app) và chọn nhánh:
- **Tháng lịch cuối của HĐ** là tháng chứa ngày kết thúc HĐ. HĐ kết thúc ngày 01 thì tháng lịch cuối là tháng liền trước.
- Kỳ cuối = tiền thuê + phí dịch vụ của tháng lịch cuối, hạn ngày 05 của tháng đó.

| Khách rời | Kỳ cuối | Nhánh |
|---|---|---|
| Trong tháng lịch cuối | Đã thu | **Đã thu đủ** – không vi phạm HĐ |
| Trong tháng lịch cuối, **trước ngày 05** | Chưa tới hạn, chưa thu | Thu kỳ cuối khi khách rời (số theo bảng kỳ thu), rồi áp **Đã thu đủ** |
| Trong tháng lịch cuối, **sau ngày 05** | Quá hạn, chưa thu | Không tự chọn. Quản lý quyết theo HĐ |
| **Trước khi tháng lịch cuối bắt đầu** | – | **Chưa thu đủ** – vi phạm HĐ, mất ký quỹ |

Khách rời trước tháng lịch cuối xin **trả trước các tháng chưa tới để giữ ký quỹ**: **không nhận**. Không tự trả lời khách; quản lý trả lời.

**B3 – Hỏi quản lý trước khi báo khách.** Gửi: mã đơn, ngày kết thúc HĐ, ngày rời, kỳ cuối đã thu chưa, nhánh anh/chị chọn. Không ghi tên khách. Hiện OTTIMO một người trực: **hỏi chủ đầu tư** (ký quỹ nằm ở sổ kế toán, chủ đầu tư duyệt và chi mọi khoản hoàn). Chờ quản lý xác nhận nhánh. Ghi sổ giao ca: "OTM-…: HĐ kết thúc dd/mm/yyyy, rời dd/mm, nhánh [đã thu đủ / chưa thu đủ], [người quyết] xác nhận lúc hh:mm".

**B4 – Báo khách theo nhánh đã xác nhận**, tích ô **Đã báo khách về ký quỹ và các khoản còn thu, còn hoàn**, bấm **Xác nhận trả sớm**.

Nội dung từng nhánh (làm ngoài app; ký quỹ và tiền thuê không ghi vào Desk):

| | **Đã thu đủ** (ESC-048) | **Chưa thu đủ** (mất ký quỹ) |
|---|---|---|
| Vi phạm HĐ | Không | Có, dù báo trước bao nhiêu ngày |
| Ký quỹ | Quyết toán như trả phòng đúng hạn HĐ: ký quỹ trừ điện nước kỳ cuối, dọn lẻ, minibar chưa thu, hư hỏng, phí phạt. Còn dư: **hoàn trong 7 ngày làm việc**, quản lý duyệt hoàn. Thiếu: thu thêm | **Mất toàn bộ ký quỹ**. Không truy thu giảm giá kỳ hạn |
| Điện nước, dọn lẻ, hư hỏng còn nợ | Trừ vào ký quỹ | **Thu thêm**, không trừ vào ký quỹ |
| Tiền thuê, phí dịch vụ | Không hoàn các ngày không ở | Đã thu cho **tháng lịch chưa bắt đầu**: hoàn (thường không có, vì thu theo ngày 05 từng tháng). **Tháng đang ở không hoàn**, không hoàn theo ngày |

Khung HĐ có thể **không hiện số ký quỹ** (sổ tay dặn không ghi ký quỹ vào Desk – mục 5.4). Số ký quỹ đúng lấy theo HĐ giấy và sổ kế toán. Khung HĐ mà hiện số tiền hoàn hoặc **Phí trả phòng sớm**: không bấm **Xác nhận trả sớm**, báo quản lý.

**Việc khi khách HĐ rời** (mọi nhánh, thêm vào bước 6 của 11.5.1):
1. **Chốt công tơ điện ngày rời**: ảnh công tơ bắt buộc, ghi người chốt. Nước tính theo người tới ngày rời (ngày trả không tính) – mục 5.4.
2. **Biên bản kiểm phòng có ảnh trong ngày rời** – bắt buộc trước khi trừ hư hỏng vào ký quỹ. Ảnh chỉ chụp căn và đồ đạc, không chụp khách hay giấy tờ.
3. Nhận lại căn: thu thẻ, chìa khóa; xóa mã cửa; kiểm minibar, hư hỏng.
4. Ngày rời: **Trả phòng** trên Desk như thường. Folio đơn HĐ không có dòng tiền thuê; tiền thuê, điện nước và ký quỹ ghi sổ kế toán.
5. Sổ giao ca: nhánh đã áp, người quyết, ngày hẹn hoàn ký quỹ (nếu có). Số tiền ký quỹ ghi sổ kế toán, không ghi Desk.

Ví dụ: HĐ Studio City, khách Việt Nam, 3 tháng, vào **20/11/2026**, kết thúc **20/02/2027**, tiền thuê 8.500.000/tháng, ký quỹ 8.500.000. Tháng lịch cuối là tháng 2/2027; kỳ cuối (01–19/02) 5.387.000 + phí dịch vụ 127.000, hạn 05/02.
- Rời **15/02**, kỳ cuối đã thu ngày 05/02 → **đã thu đủ**, không vi phạm. Ký quỹ 8.500.000 trừ điện nước 01–15/02 (giả sử 600.000) → hoàn **7.900.000** trong 7 ngày làm việc. Không hoàn 16–19/02.
- Rời **03/02**, kỳ cuối chưa tới hạn → thu kỳ cuối 5.387.000 + 127.000 khi khách rời, rồi quyết toán như trên.
- Rời **25/01** → **chưa thu đủ**, mất 8.500.000. Khách xin trả tháng 2 để giữ ký quỹ → không nhận.

#### 11.5.4 Khách HĐ rời trong phần gia hạn sau HĐ

Khách đã ở hết HĐ rồi gia hạn thêm, nay rời trước ngày cuối gia hạn. Ở v1.0.2 Desk **vẫn hiện khung Trả trước hạn hợp đồng thuê tháng** (lỗi đã biết, mục 17.5).
- HĐ đã xong: ký quỹ theo nhánh **đã thu đủ** (11.5.3).
- Các ngày gia hạn chưa ở: như trả sớm đơn ngắn ngày Trực tiếp – báo trước từ 1 ngày hoàn 50 % tiền các ngày gia hạn chưa ở, báo trong ngày rời không hoàn. Làm ngoài app (tiền ngày gia hạn của đơn HĐ thu ngoài app – mục 9.3), quản lý duyệt hoàn.
- Tiền gia hạn **chưa thu**: không có gì để hoàn. Thu tiền các ngày đã ở **cộng** phần không hoàn của các ngày chưa ở (50 %, hoặc 100 % nếu báo trong ngày rời). Ví dụ gia hạn 20/02 → 27/02, 283.000/ngày, khách báo 22/02 rời 24/02 (báo trước 2 ngày): 3 ngày chưa ở 849.000. Đã thu đủ 7 ngày → hoàn **425.000** (50 %, làm tròn lên). Chưa thu → thu 4 × 283.000 + 424.000 = **1.556.000**.
- Vẫn làm B3: hỏi quản lý trước khi báo khách.

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
   - **Đổi nơi nhận** (khách báo đổi tài khoản; hoặc nơi nhận là **Tiền mặt** mà khách đã về): bấm lại **Nhập nơi nhận hoàn** ở cùng dòng (nút vẫn hiện khi đã có nơi nhận), chọn lại **Cách hoàn**, bấm **Lưu**. Yêu cầu đã duyệt thì quay về **Chờ duyệt**, phải duyệt lại.
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

> **Lỗi nhỏ đã biết:** sau khi chi hoàn, thông báo có dấu trừ thừa, ví dụ "Đã ghi hoàn -500.000 đ" (số ghi sổ đúng – v1.0.3 hoặc v1.0.4).

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

Khi chủ đầu tư báo gói website mới (LP-v2) đã lên: web hiện giá ước tính (mục 13.1c) và có thêm trang tiếng Hàn, tiếng Trung, tiếng Nga (mục 13.1d).

> **Tạm ở v1.0 (tới v1.0.1 có tin báo qua Google Chat):** Desk chưa báo yêu cầu mới ra ngoài màn hình. Khi form bật:
> - Desk mở trên máy quầy và điện thoại người trực **07:00–22:00**. Xem **Yêu cầu từ website** mỗi lần cầm máy, và ngay sau mỗi việc ở quầy.
> - Hạn trả lời 15 phút áp trong **08:00–21:00**. Trả lời khách từ tài khoản OTTIMO (mục 4.1).
> - Yêu cầu tới ngoài giờ: bấm **Nhận xử lý** khi thấy, nhắn khách từ 08:00 sáng hôm sau.
>
> Từ v1.0.1 vẫn giữ Desk mở như trên. Tin Google Chat (mục 13.1a) chỉ giúp thấy yêu cầu nhanh hơn; **Desk vẫn là nguồn chính**.

[ẢNH: C2-39-Yêu cầu từ website, form tắt]

### 13.1a Tin báo yêu cầu qua Google Chat (từ v1.0.1)

**Đã có từ 03/11 (v1.0.1).** Tin Chat ở **mức A**: chỉ mã yêu cầu, giờ nhận, hạn phản hồi, mức gấp và link **Mở Desk**. Tin **không có** tên, liên hệ, kênh, lời nhắn, ngày ở, số khách: mở Desk để xem. Mức có chi tiết khách (chủ đầu tư chọn ở ESC-041) **chưa bật**: chờ đội kiểm trên phòng Chat thử (ESC-046). Khi bật, chủ đầu tư báo và bộ hướng dẫn cập nhật mục này. Người trực vẫn giữ Desk mở 07:00–22:00 (mục 13.1).

- **Phòng:** **"OTTIMO – Yêu cầu đặt phòng"** trên Google Chat, tài khoản `@ottimo.vn`.
- **Thành viên:** chủ đầu tư, quản lý, lễ tân trưởng, lễ tân. Chủ đầu tư và quản lý là **quản lý phòng** (người được xóa tin, thêm, bớt người).
- **Không mở Google Chat trên máy quầy đã cấp quyền.** Chỉ dùng ứng dụng Google Chat trên điện thoại (cùng luật với Zalo ở mục 4.1: máy quầy không cài, không mở ứng dụng chat).

Desk tự đăng tin vào phòng khi:

| Khi nào | Tin có gì |
|---|---|
| Có yêu cầu mới, **mọi giờ, kể cả ban đêm** | Tin đầu: "Yêu cầu đặt phòng mới", mã yêu cầu (8 ký tự), giờ nhận (thêm "ngoài giờ trực" khi gửi ngoài giờ quầy), hạn phản hồi. Thêm "cần gọi ngay" khi khách gửi ngoài giờ mà đến ngay hôm đó; thêm "cần xem kỹ" khi Desk thấy yêu cầu có điểm lạ. Dòng cuối luôn là **Mở Desk** |
| Yêu cầu quá hạn mà chưa ai **Nhận xử lý** | Tin nhắc trong cùng luồng, nhắc cả phòng (@all): "Chưa có người nhận", mã, giờ nhận, "đã quá hạn phản hồi" |
| 07:30 sáng | Tin nhắc trong cùng luồng cho yêu cầu ban đêm còn chưa ai nhận: "Chưa có người nhận", mã, giờ nhận, hạn phản hồi |
| Yêu cầu vừa bị xóa theo yêu cầu người gửi (mục 13.1b) | Tin trong cùng luồng: "Đã xóa dữ liệu của … theo yêu cầu của khách…". Chỉ có mã |

Mẫu tin đầu (dữ liệu giả):
- `Yêu cầu đặt phòng mới · 7K3P9QXA`
- `Nhận lúc 14:05 · hạn phản hồi 14:20`
- `Mở Desk: https://desk.ottimo.vn/website-requests/…`

Mẫu tin nhắc khi quá hạn (dữ liệu giả):
- `@all Chưa có người nhận · 7K3P9QXA`
- `Nhận lúc 14:05 · đã quá hạn phản hồi 14:20`
- `Mở Desk: https://desk.ottimo.vn/website-requests/…`

Cách dùng:
1. Thấy tin: mở Desk, **Nhận xử lý** như mục 13.1. Trả lời khách từ tài khoản OTTIMO (mục 4.1), **không** trả lời khách từ Chat.
2. Báo đồng nghiệp trong phòng: chỉ ghi **mã yêu cầu** và việc ("đã nhận", "đã gọi"). **Không** gõ lại tên, số điện thoại, lời nhắn của khách.
3. **Tin thật từ Desk** có đúng dạng mẫu trên và luôn kết thúc bằng một dòng **Mở Desk** tới `desk.ottimo.vn`. Ở mức A tin không có tên, số điện thoại hay lời nhắn của khách. Tin khác dạng này, hoặc có link lạ: không bấm, báo chủ đầu tư.
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
| 3 | Quản lý phòng (quản lý; dự phòng chủ đầu tư) | **Trong 24 giờ** từ lúc xóa trên Desk | Trong phòng **"OTTIMO – Yêu cầu đặt phòng"**, tìm theo mã: gõ 8 ký tự sau "REQ-". Xóa **mọi tin của luồng đó**: tin đầu, các tin nhắc, tin "Đã xóa dữ liệu…", và **mọi tin nhân viên trả lời** trong luồng. Tìm lại lần nữa để chắc không còn |
| 4 | Quản lý phòng | Ngay sau bước 3 | Ghi **sổ xóa Chat** (trang riêng cuối sổ giao ca): mã yêu cầu · ngày xóa trên Desk · ngày xóa Chat · người làm · "đã xóa" hoặc "không còn trong Chat". **Chỉ mã, không tên, không SĐT.** Không nhắn gì trong phòng Chat về việc xóa |
| 5 | Chủ đầu tư | Mỗi tháng, cùng lúc rà thành viên phòng | Đối chiếu sổ xóa Chat với các yêu cầu đóng lý do "Đã xóa theo yêu cầu của người gửi" trong tháng trên Desk. Mã nào chưa có dòng "đã xóa": làm ngay bước 3 |

- Cả quản lý và chủ đầu tư vắng, không ai xóa được trong 24 giờ: chủ đầu tư làm khi về, ghi lý do chậm vào sổ xóa Chat.
- Quản lý phòng không thấy nút xóa ở tin do Desk đăng: báo chủ đầu tư ngay, chủ đầu tư báo đội.
- Yêu cầu bị đánh dấu spam sau khi tin đã đăng: nên xóa luồng trong Chat như bước 3 (không bắt buộc).

### 13.1c Giá ước tính khách đã thấy trên website

**Áp dụng khi chủ đầu tư báo gói website LP-v2 đã lên và đã bật hiện giá.** Trước đó web không hiện giá, Desk không có các dòng dưới đây.

**Khách thấy gì trên website.** Trong form đặt phòng, sau khi khách chọn hạng phòng, ngày và số khách, web hiện **giá ước tính** cho cả chuyến:
- Chỉ cho **ngắn ngày (1–29 đêm)**. Chọn theo tháng hoặc từ 30 đêm: web **không hiện số**, chỉ mời khách nhận báo giá riêng.
- Đi liền con số luôn có: ước tính, đã gồm thuế, cho số khách đã chọn, **chưa giữ phòng**; giá cuối cùng và phòng trống nằm trong **báo giá OTTIMO gửi**.
- Có lúc web không hiện số (chưa đủ số đêm tối thiểu, quá số khách của hạng, giá chưa mở, hệ thống tính giá lỗi). Khách vẫn gửi được yêu cầu.
- Số do Desk tính, cùng cách tính với **Báo giá**. Chủ đầu tư đổi giá trên Desk thì web đổi theo, không ai gõ giá vào website.

**Trên Desk:**
1. Mở yêu cầu. Ngăn chi tiết có dòng **Giá ước tính khách đã thấy**: "{số} – tính lúc {giờ}". Có thể có thêm dòng "Lúc khách gửi, hệ thống tính lại: {số}". Khách không thấy số nào: dòng ghi **Khách chưa thấy giá**.
2. Bấm **Báo giá** từ yêu cầu (mục 4.2). Hộp báo giá so số Desk tính bây giờ với số khách đã thấy và hiện một trong ba dòng:

| Desk hiện | Nghĩa | Làm gì |
|---|---|---|
| "Khớp giá ước tính khách đã thấy (…)" | Báo giá bằng số khách đã thấy | Gửi như thường |
| Khung cảnh báo **"Khác giá web khách đã thấy: {cũ} → {mới}"** kèm câu "Giá theo lịch giá hôm nay khác số khách thấy trên web. Nói rõ lý do với khách khi gửi báo giá." | Giá theo lịch giá hôm nay khác số khách đã thấy trên web, cùng ngày, cùng số khách, cùng hạng | Gửi báo giá kèm một câu giải thích ngắn: giá đã đổi từ lúc khách xem, hoặc căn giá thấp nhất của hạng đã có khách nên báo căn khác cùng hạng. Không hứa giữ số cũ |
| "Khách đã thấy … cho ngày, số khách hoặc hạng phòng khác – không so sánh." | Khách xem giá cho chuyến khác với chuyến đang báo | Báo giá theo ngày, số khách đã thống nhất với khách |

3. **Giá trong báo giá Desk là giá cuối.** Khách xin giữ đúng số đã thấy trên web: không hứa, báo lễ tân trưởng hoặc quản lý quyết trong ca.
4. Khách hỏi giá thuê tháng: web không có số; lập báo giá dài hạn như thường.

### 13.1d Khách viết bằng tiếng Hàn, tiếng Trung, tiếng Nga

**Áp dụng từ khi chủ đầu tư báo trang tiếng Hàn, tiếng Trung hoặc tiếng Nga của ottimo.vn đã lên** (gói LP-v2; mỗi ngôn ngữ lên riêng, khi đã có người bản xứ đọc lại và luật sư đồng ý). Giao diện Desk vẫn chỉ có tiếng Việt và tiếng Anh.

**1. Nhận ra khách**
- **Yêu cầu từ website** có cột **Ngôn ngữ**: Tiếng Anh · Tiếng Việt · Tiếng Hàn · Tiếng Trung (giản thể) · Tiếng Nga. Ngăn chi tiết của yêu cầu có dòng **Ngôn ngữ khách dùng**.
- Lọc được theo ngôn ngữ, cùng với lọc trạng thái. Ví dụ: chỉ xem yêu cầu tiếng Hàn đang chờ. Desk hiện tổng số yêu cầu khớp lọc.
- Tên và lời nhắn hiện đúng chữ khách gõ (chữ Hàn, chữ Hán, chữ Nga). Thấy ô vuông hoặc ký tự lạ thay cho chữ: báo chủ đầu tư kèm **mã yêu cầu** (mục 19).

**2. Trả lời bằng ngôn ngữ nào**

| Khách viết bằng | Tin anh/chị tự soạn | Báo giá, giữ chỗ (ô **Ngôn ngữ gửi khách**) |
|---|---|---|
| Tiếng Hàn | Tiếng Anh | Desk chọn sẵn **English** và hiện câu "Khách viết bằng tiếng Hàn – gửi tin bằng tiếng Anh." |
| Tiếng Trung | Tiếng Anh | Desk chọn sẵn **English** và hiện câu "Khách viết bằng tiếng Trung – gửi tin bằng tiếng Anh." |
| Tiếng Nga | Tiếng Anh | Desk chọn sẵn **Русский** (Desk có sẵn mẫu báo giá tiếng Nga) và hiện câu "Khách viết bằng tiếng Nga – gửi tin bằng tiếng Nga." |

- Câu ghi chú "Khách viết bằng tiếng … – gửi tin bằng tiếng …" (tiếng Anh với khách tiếng Hàn, tiếng Trung; tiếng Nga với khách tiếng Nga) hiện ở **cả** hộp **Báo giá** (dưới ô **Ngôn ngữ gửi khách**) và hộp **Giữ chỗ** (dưới phần cọc). "Gửi tin bằng tiếng Nga" là nói khối chữ Desk tạo (báo giá, giữ chỗ); tin anh/chị tự soạn vẫn bằng tiếng Anh.
- Không đổi ô sang **Tiếng Việt**. Nhìn lại ô trước khi bấm **Sao chép gửi Zalo**.
- Khách tự viết bằng tiếng Anh: trả lời tiếng Anh như thường. Khách chọn "Gọi": nói tiếng Anh chậm, rõ; không hiểu nhau thì nhắn tin qua kênh khách đã chọn.

**3. Dùng Google Dịch để đọc và soạn tin**

Chủ đầu tư **cho phép** dùng công cụ dịch bên ngoài (Google Dịch hoặc công cụ tương tự) để đọc tin của khách và soạn câu trả lời, **trên mọi màn hình Desk**.
- **Đọc:** mở yêu cầu, chép lời nhắn, dán vào Google Dịch (trang `translate.google.com` hoặc ứng dụng Google Dịch trên điện thoại cơ sở), chọn dịch sang Tiếng Việt. Dùng nút **Dịch trang** của trình duyệt cũng được.
- **Nên** dịch trong ngăn của **một yêu cầu** đang mở, không dịch cả trang danh sách: gọn, ít lẫn chữ của khách khác. Đây là lời khuyên, không phải lệnh cấm.
- **Soạn:** ưu tiên câu mẫu ở phần 4. Cần viết thêm: viết câu tiếng Việt ngắn, dịch sang tiếng Anh, đọc lại bản tiếng Anh một lượt rồi mới gửi.
- **Số tiền, ngày ở, cọc, chính sách hủy:** chỉ dùng chữ Desk tạo (**Sao chép gửi Zalo**). Không qua máy dịch, không gõ lại bằng tay.
- Bản dịch lời nhắn chưa rõ (ngày ở, số khách, yêu cầu đặc biệt): **không đoán**. Gửi câu mẫu 2.
- Mọi luật nhắn khách vẫn giữ: chỉ nhắn từ tài khoản OTTIMO (mục 4.1), không gửi mã cửa, không nhận số thẻ (mục 16.2).
- **Không** dùng **Dịch trang** (hay công cụ dịch nào) ở màn **Giấy tờ & khai báo** và màn xem ảnh giấy tờ. Số giấy tờ và ảnh giấy tờ không phải chữ cần dịch, và tờ **Your ID details** bản v2 chỉ báo khách rằng tin nhắn của khách có thể được dịch (mục 7.2). Lỡ bật dịch trên trình duyệt: tắt trước khi mở các màn này.
- **Khách nói không muốn tin nhắn của mình được dịch** (mọi khách, không riêng ngày thay tờ): không đưa tin của khách đó qua dịch vụ dịch, và ghi lại để mọi ca cùng biết:
  - Ghi vào **trang Không dịch**: trang riêng ở **đầu** sổ giao ca, dùng chung cho mọi ca và mọi ngày, không sang trang mới theo ca (khách ở dài ngày, HĐ thuê tháng vẫn còn dòng của mình). Mỗi dòng: mã đơn `OTM-…` · chữ "không dịch" (hoặc "chưa xem v2", mục 7.2) · ngày ghi. Khách hỏi qua website chưa có đơn: ghi mã yêu cầu `REQ-…` thay cho mã đơn. **Chỉ mã**, không tên, không số điện thoại, không số căn.
  - Lập đơn từ một yêu cầu có trong trang: ghi thêm mã đơn mới vào **cùng dòng**, cạnh mã yêu cầu.
  - Sổ giao ca của ca đó vẫn ghi một dòng nhắc: "Trang Không dịch: thêm OTM-…" (hoặc `REQ-…`).
  - Dòng giữ nguyên, không gạch.
  - **Trước khi dịch tin của một khách**, mở trang Không dịch: mã đơn hoặc mã yêu cầu của khách có trong trang thì **không** dịch.
  - Ghi ở trang này, không ghi trên Desk: Desk v1.0.4 chưa có ô ghi chú trên màn đơn và màn yêu cầu mà ca sau mở ra là thấy.

**4. Ba câu mẫu tiếng Anh**

Chép nguyên câu, thay `{code}` bằng mã yêu cầu (ví dụ `REQ-…`), thay `{details}` bằng cụm bên dưới. Không thêm emoji, dấu "!". Dùng được cả cho khách viết tiếng Anh. Phần tiếng Việt là nghĩa cho anh/chị, **không gửi khách**. Gửi qua email thì ký cuối thư: "OTTIMO Boutique Stay, Da Lat".

**Câu 1 – Đã nhận yêu cầu, hẹn gửi báo giá.** Chỉ dùng khi chưa báo giá được ngay; báo giá được ngay thì dùng câu 3.
- Trong giờ trực (07:00–22:00):
  > Thank you for your request {code}. We have received it and will send your quote within 1 hour.
- Ngoài giờ trực:
  > Thank you for your request {code}. We have received it and will send your quote before 09:00 tomorrow morning.
- Thêm cho khách tiếng Hàn, tiếng Trung (không bắt buộc, gửi cùng tin; **không** dùng với khách tiếng Nga vì báo giá gửi tiếng Nga):
  > We will write to you in English. You are welcome to reply in your own language.

Nghĩa: "Cảm ơn bạn đã gửi yêu cầu {code}. Chúng tôi đã nhận và sẽ gửi báo giá trong vòng 1 giờ / trước 09:00 sáng mai." Câu thêm: "Chúng tôi sẽ viết bằng tiếng Anh. Bạn cứ trả lời bằng tiếng của bạn." (anh/chị dùng Google Dịch để đọc).

**Câu 2 – Hỏi lại thông tin thiếu, mời khách viết thêm bằng tiếng Anh khi bản dịch chưa rõ.**
  > Thank you for your message. To prepare your quote, could you confirm {details}? A few words in English help us make sure we understand you correctly.

Cụm thay `{details}` (chọn một, hoặc nối bằng "and"): `your arrival and departure dates` (ngày đến, ngày đi) · `the number of adults and children` (số người lớn, trẻ em) · `the ages of the children` (tuổi của trẻ) · `which room type you prefer` (hạng phòng khách muốn).

Chỉ là bản dịch chưa rõ, không thiếu thông tin:
  > Thank you for your message. We want to be sure we understand you correctly. Could you write it again in a few words of English?

Nghĩa: "Cảm ơn tin nhắn của bạn. Để làm báo giá, bạn xác nhận giúp {…} nhé? Vài chữ tiếng Anh giúp chúng tôi hiểu đúng ý bạn." / "Chúng tôi muốn chắc là hiểu đúng ý bạn. Bạn viết lại giúp vài chữ tiếng Anh được không?" Không bao giờ hỏi số giấy tờ, số thẻ, ảnh giấy tờ ở bước này.

**Câu 3 – Gửi báo giá.** Gửi ngay trước khối chữ chép từ Desk (**Sao chép gửi Zalo**). Khách tiếng Nga: khối báo giá là tiếng Nga, câu dẫn vẫn tiếng Anh.
  > Here is your quote for request {code}. The room is not yet held. When you are ready, reply to this message and we will hold it for you and send the deposit details.

Nghĩa: "Đây là báo giá cho yêu cầu {code}. Phòng chưa được giữ. Khi bạn sẵn sàng, trả lời tin này – chúng tôi sẽ giữ phòng và gửi thông tin đặt cọc." Tin này **không** kèm mã VietQR; mã cọc gửi sau khi tạo giữ chỗ, kèm câu ở mục 4.1.

**5. Hạn trả lời**
- Hạn như mọi yêu cầu website (mục 13.1): xem cột **Hạn trả lời** trên Desk. Dịch không phải lý do trễ hạn. Chưa báo giá kịp: gửi câu mẫu 1 trong hạn, rồi gửi báo giá sau.
- Trang cảm ơn đã hứa với khách, bằng ngôn ngữ của khách (theo tham số 01/11): gửi trong **07:00–22:00** → OTTIMO trả lời **trong 60 phút** ("within 1 hour"); gửi ngoài giờ → trả lời **trước 09:00 sáng hôm sau**. Câu mẫu 1 dùng đúng hai mốc này. Đừng để quá lời hứa.
- Yêu cầu gửi ngoài giờ mà **ngày đến là hôm nay** (khách cần chỗ ngay đêm nay): không dùng câu mẫu 1. **Liên hệ khách ngay**, gọi nếu khách để số; trang cảm ơn cũng đã mời khách gọi cho OTTIMO.

### 13.2 Điều phối buồng phòng trên Desk

1. **Vận hành → Buồng phòng**: **Việc buồng phòng hôm nay** (tiến độ **… xong**) và **Trạng thái buồng** từng căn.
2. Thêm việc: **Việc mới** → hộp **Tạo việc buồng phòng**: **Căn**, **Loại việc**, **Ngày làm**, **Ghi chú cho buồng phòng** → bấm **Việc mới** ở cuối hộp.
3. Hủy việc: **Hủy việc** → **Lý do** (**Treo biển "Không làm phiền"**, **Khách nói không cần dọn**, **Lý do khác** – lý do khác phải ghi **Ghi chú**) → **Hủy việc**.
4. Làm thay buồng phòng: **Làm xong** ở dòng việc. Người trực hiện nay đánh dấu việc dọn ở đây (tài khoản có vai quản lý chưa vào được app nhân viên). Từ v1.0.4 vẫn bấm **Làm xong** ở đây (hoặc trên app), rồi kiểm trên app (mục 14.2).

Trạng thái buồng: `VD` trống, cần dọn · `CL` đang dọn · `VC` đã dọn, chờ kiểm · `VI` đã kiểm, sẵn sàng · `OC` có khách, sạch · `OD` có khách, cần dọn · `OOO` khóa phòng, đang sửa. Nhận khách vào căn `VC` hoặc `VI`. Mỗi sáng 07:00, Desk chuyển các căn có khách sang "cần dọn".

[ẢNH: C2-40-Buồng phòng trên Desk, việc mới]

### 13.2a Khi chưa ai kiểm phòng được (người trực hiện nay; từ v1.0.4 là dự phòng)

> **Áp dụng từ v1.0.4** (mặc định đội chọn, chủ đầu tư đổi được): người trực vào được app nhân viên, nên **kiểm căn trên app** (mục 14.2). Cách ở mục này chỉ còn là **dự phòng**.
> - **Mốc giờ giữ nguyên:** căn trống từ đêm qua có khách đến: kiểm xong **trước 11:00**. Căn khách trả có khách mới cùng ngày: kiểm xong **trước 14:00**. Căn trống quá 3 ngày: kiểm lại trong ngày khách đến.
> - **Trình tự:** dọn xong → **Làm xong** (căn `VC`) → kiểm trên app → **Kiểm đạt – sẵn sàng** (căn `VI`). Người dọn thuê theo giờ không có tài khoản: người trực bấm **Làm xong** thay, rồi kiểm trên app. Mỗi căn thêm khoảng 1–2 phút. Căn mất Wi-Fi thì dùng 4G.
> - **Dự phòng:** không vào được app cho căn đó (mất mạng, mất điện thoại, app báo lỗi): kiểm bằng mắt theo bước 1 dưới đây, bấm **Làm xong**, ghi sổ giao ca "Kiểm bằng mắt căn … – hh:mm – lý do".
> - **Nhận phòng:** nhận khách vào căn `VI`. Căn còn `VC` lúc khách tới: kiểm trên app ngay rồi nhận. Không kiểm trên app được: làm như gạch **Dự phòng**, rồi nhận (Desk vẫn cho nhận vào `VC`).

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
- Khách trả phòng trước 06:00 (kể cả đúng ngày đi ghi trên đơn): nút **Trả phòng** chỉ hiện từ 06:00. Làm theo mục 11.5.1, gạch **Khách đi trước 06:00**.
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

> **Tạm ở v1.0 (tới v1.0.3 hoặc v1.0.4):** tài khoản chỉ có vai Bảo trì chưa chọn được căn trên Desk, nên **không tạo phiếu, không khóa phòng được trên Desk**. Bảo trì báo sự cố trên app (tích **Đề nghị khóa căn**) hoặc nhắn lễ tân ngày, căn, lý do. **Lễ tân hoặc người trực** tạo phiếu và khóa phòng (cả **Khóa phòng có kế hoạch**) trên Desk theo mục này.

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

> **Áp dụng từ v1.0.4:** tài khoản có vai chủ đầu tư, quản lý hoặc lễ tân trưởng đăng nhập app bằng mã 6 số và bấm **Kiểm phòng** được. Người trực hiện nay kiểm theo mục này, giữ mốc 11:00 và 14:00 của mục 13.2a (mặc định đội chọn, chủ đầu tư đổi được). Mục 13.2a là dự phòng.

1. Đăng nhập `staff.ottimo.vn` trên điện thoại (mục 1.8).
2. Nhận thông báo **Căn đã dọn – chờ kiểm**. Mở căn `VC` → nút **Kiểm phòng** → màn **Kiểm phòng … · …**.
3. Đi từng mục trong danh mục (12 mục: ga gối, phòng tắm, khăn, đồ dùng, bếp, bàn làm việc, Wi-Fi, rèm/cửa sổ, mùi, remote/điều hòa/sưởi, thẻ chào…), đánh dấu khi đạt chuẩn OTTIMO. App hiện **Đã kiểm …/12 mục**.
4. Đạt hết: **Kiểm đạt – sẵn sàng**. Căn chuyển **Sẵn sàng đón khách** (`VI`).
5. Chưa đạt: **Chưa đạt** → ghi chỗ chưa đạt → **Ghi chưa đạt**. Căn quay về **Cần dọn (khách đã đi)** và có việc dọn lại.

[ẢNH: C3-05-Kiểm phòng]

- Căn trống quá 3 ngày cần kiểm lại trước khi nhận khách.
- Kiểm phòng cần có mạng.
- Tới v1.0.4: ngày lễ tân trưởng nghỉ, hoặc tài khoản có vai quản lý (người trực hiện nay), thì **không ai bấm kiểm được**. Lễ tân vẫn nhận khách vào căn **Đã dọn – chờ kiểm** (`VC`), sau khi căn đã được kiểm bằng mắt theo mục 13.2a.

### 14.3 Duyệt yêu cầu trong hạn mức

1. **Cần duyệt**.
2. Đọc: ai gửi, lúc nào, số tiền, lý do.
   - Yêu cầu nhận phòng khi buồng chưa sẵn sàng: chỉ duyệt khi **Lý do** ghi đã kiểm căn trống, có giờ và người kiểm. Căn có khách đổi phòng hôm nay mà **Lý do** không ghi đã kiểm: gọi quầy hoặc từ chối.
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
| Khách báo sẽ rời sớm | Mục 11.5 (nút **Trả sớm**, từ v1.0.2). Không hứa số hoàn. Khách thuê tháng: hỏi quản lý trước khi báo khách về ký quỹ |
| Đơn đã quá ngày đi vẫn **Đang ở**, không thấy nút **Trả phòng** | Kiểm căn, hỏi buồng phòng khách đã đi ngày nào. **Gia hạn** tới hôm nay rồi **Trả phòng**. Khách ở thật thì thu đêm thêm; khách đã đi từ trước (quên bấm) thì xin giảm 100 % đêm thêm, quản lý hoặc chủ đầu tư duyệt (mục 11.1, **Đơn quá ngày đi**) |
| Khách hỏi phòng sẵn sàng lúc mấy giờ | "Check-in is from 12:00. Your room is always ready by 14:00." / "Nhận phòng từ 12:00. Phòng luôn sẵn sàng lúc 14:00." |
| Khách hỏi Wi-Fi | Đọc tên mạng và mật khẩu trên thẻ Wi-Fi trong căn. Đừng nói khách "xem Wi-Fi trên trang khách" (mục 17.6) |
| Khách muốn xem/xóa dữ liệu của mình | Ghi yêu cầu, chuyển chủ đầu tư |
| Người gửi form website xin xóa yêu cầu của họ | Mục 13.1b |
| Yêu cầu website viết bằng tiếng Hàn, tiếng Trung, tiếng Nga | Trả lời bằng tiếng Anh, được dùng Google Dịch để đọc và soạn; báo giá theo ô **Ngôn ngữ gửi khách** Desk chọn sẵn (mục 13.1d) |
| Hộp báo giá hiện **"Khác giá web khách đã thấy: … → …"** | Giá theo lịch giá hôm nay khác số khách đã thấy trên web. Gửi báo giá kèm câu giải thích, không hứa giữ số cũ (mục 13.1c) |
| Tin lạ trong phòng Google Chat (không có dòng **Mở Desk** cuối tin, có link lạ) | Không bấm, báo chủ đầu tư (mục 13.1a) |
| Đơn OTA về khi căn đã kín | Lưu chưa gán căn, báo quản lý; gán căn hoặc đổi phòng khách khác (mục 5.3) |
| Hoàn tác nhận phòng bị Desk từ chối | Folio đã có dòng mới; nhờ quản lý (mục 7.4) |
| Lỡ bấm sai một khoản thu | Báo quản lý **Đảo giao dịch**. Lễ tân không xóa được giao dịch |
| Phím Esc không đóng khung đơn | Bấm **Đóng** (sửa ở v1.0.4) |
| Tìm đơn theo tên khách không ra | Tìm theo mã đơn, mã OTA hoặc SĐT ở **Khách hàng** (sửa ở v1.0.4) |
| Báo giá thứ Sáu 1 đêm chỉ báo "tối thiểu 2 đêm" sau khi mở hộp | Đúng quy tắc; chọn 2 đêm (chữ sửa ở v1.0.4) |
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
- Không nhận khách vào căn `VD`, `CL` mà không qua xác nhận của lễ tân trưởng. Không bao giờ nhận khách vào căn đang có khách (`OC`, `OD`), căn còn đơn khác đang ở, hoặc căn `OOO`.
- Không bán căn của đơn đã trả đủ/OTA đã thu trong đêm đánh dấu không đến, trước 06:00.
- Không thu tiền ngoài Desk.
- Không tạo, không gửi link check-in online cho khách thật (tới khi chủ đầu tư báo mở lại).
- Không chép tên, SĐT, lời nhắn của khách từ phòng Google Chat sang Zalo hay nơi khác. Không mở Google Chat trên máy quầy. Không mời ai vào phòng Chat (mục 13.1a).

---

## 17. Tạm thời tới v1.0.3 và các bản sau

Các việc dưới đây làm theo cách tạm từ **02/11** tới khi **chủ đầu tư báo** bản có sửa đã lên. Giữ chỗ quá hạn (17.1) và check-in online (17.3) sửa ở **v1.0.3** (dự kiến 07/11); lý do hủy "Khác" (17.2) sửa ở v1.0.3 hoặc v1.0.4. Bản v1.0.1 (đã lên 03/11) chỉ có tin Google Chat, chưa sửa các việc này. Khi chủ đầu tư báo, bỏ cách tạm, làm theo Desk mới. Riêng **mục 17.5** là giới hạn của bản v1.0.2, giữ tới v1.0.3.

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
- **Nếu chủ đầu tư đã báo v1.0.3 lên**: **Xác nhận đã nhận cọc** phần còn lại → **Nhận phòng**.
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

### 17.5 Trả sớm đơn HĐ thuê tháng – giới hạn tới v1.0.3 (sửa ở v1.0.4)

Cách tạm cũ (để căn **Đang ở** tới ngày đi, quản lý giảm tiền trên folio) **bỏ từ v1.0.2**. Mọi khách rời sớm làm theo **mục 11.5**. Với đơn dài hạn nhập tay, Desk v1.0.2 và v1.0.3 còn 3 giới hạn, sửa ở v1.0.4:

1. **Gia hạn làm mất ngày kết thúc HĐ trên Desk.** Bấm **Gia hạn** trên đơn HĐ thì Desk dời **Ngày ra (theo HĐ)** sang ngày cuối gia hạn và không giữ ngày kết thúc HĐ gốc. Khung đơn đang ở chưa có ô ghi chú cho lễ tân. Vì vậy **trước khi bấm Gia hạn**, ghi "OTM-…: HĐ kết thúc dd/mm/yyyy, gia hạn tới dd/mm/yyyy" vào **bảng kỳ thu** (dòng của căn) và **sổ giao ca** (mục 9.3 bước 6).
2. **Khách rời trong phần gia hạn sau HĐ** vẫn thấy khung **Trả trước hạn hợp đồng thuê tháng**. Đây là lỗi đã biết, không phải vi phạm HĐ: làm theo mục 11.5.4.
3. **Nhật ký thay đổi của đơn HĐ** có thể ghi "BR-428 notice …" (quy tắc trả sớm đơn ngắn ngày). Bỏ qua dòng này. Nhánh đã áp và người quyết ghi ở **sổ giao ca** (mục 11.5.3 B3).

> **Áp dụng từ v1.0.4** (khi chủ đầu tư báo v1.0.4 đã lên; tới lúc đó làm như trên):
> - Desk **giữ ngày kết thúc HĐ** khi gia hạn. **Ngày ra** trên khung đơn vẫn dời sang ngày cuối gia hạn, và Desk không hiện ngày kết thúc HĐ: bảng kỳ thu vẫn giữ cột này (theo HĐ giấy). Không cần ghi dòng "HĐ kết thúc…" vào sổ giao ca trước khi bấm **Gia hạn** nữa.
> - **Trả sớm** chỉ hiện khung **Trả trước hạn hợp đồng thuê tháng** khi khách rời **trước** ngày kết thúc HĐ. Khách rời trong phần gia hạn sau HĐ: không còn khung này; ký quỹ và tiền các ngày gia hạn vẫn làm ngoài app như cũ (Desk không có dòng tiền cho phần gia hạn của đơn HĐ). Desk hiện (hoặc không hiện) khung HĐ khác với HĐ giấy (ví dụ HĐ đã ký lại với ngày kết thúc mới: Desk vẫn giữ ngày kết thúc cũ): dừng, hỏi quản lý.
> - Nhật ký đơn HĐ rời trước hạn ghi "BR-313 lease early end – deposit per lease" thay cho "BR-428 notice …". Nhánh và người quyết vẫn ghi sổ giao ca (mục 11.5.3 B3).

### 17.6 Lỗi đang sửa khác

| Lỗi | Cách tạm |
|---|---|
| Chưa nhập được Wi-Fi trên Desk; trang khách ghi "hỏi lễ tân" | Khách xem thẻ Wi-Fi trong căn; lễ tân đọc khi khách hỏi |
| Hộp **Đổi phòng** lẫn căn chưa dọn (`VD`) | Kiểm trạng thái căn trên Buồng phòng/Sơ đồ phòng trước khi chọn (mục 9.4) |
| Gia hạn đơn kênh Nội bộ: đêm thêm lấy giá Trực tiếp thay vì 0 đ, không sửa về 0 được (BUG-R4-038, sửa ở v1.0.4) | Không bấm **Gia hạn**; tạo đơn Nội bộ mới 0 đ cho các đêm thêm (mục 9.3 bước 7) |
| Hộp **Xác nhận cọc** chưa có ô mã giao dịch | Ghi mã giao dịch vào sổ giao ca |
| Nút **Nhập nơi nhận hoàn** hiện trên máy chưa cấp quyền nhưng không lưu | Làm trên máy quầy đã cấp quyền (mục 1.5) |
| Folio đã khóa: câu báo ghi "Chỉ quản lý ghi được bút toán điều chỉnh" (sai – không ai ghi được) | Bỏ qua vế "chỉ quản lý". Thu công nợ; phát hiện mới ghi sổ giao ca, báo chủ đầu tư |
| Dòng miễn **Bị từ chối** vẫn hiện số âm ở màn Trả phòng | Đọc **Còn phải thu** |
| **Hoàn tác nhận phòng** bấm được nhưng bị từ chối khi folio có dòng mới | Nhờ quản lý (mục 7.4) |
| Một số chữ trên màn chưa đúng ("Khách đứng tên" ở người đi cùng, "Giờ trả phòng thực tế" ở xác nhận giờ trả, "Round 3 / R2", gợi ý mã cửa theo ngày sinh) | Làm theo tệp này |
| App nhân viên chưa có màn đổi mật khẩu tạm: còn mật khẩu tạm mà vào app thì mọi màn báo "Chưa tải được … Có thể do mạng yếu" (BUG-R3-052, **sửa ở v1.0.4**: đổi ngay trên app, mục 1.8) | Đổi mật khẩu tạm trên Desk trước (mục 1.2), rồi đăng nhập lại app. Áp cả sau mỗi lần chủ đầu tư **Đặt lại mật khẩu** |
| Tài khoản chỉ có vai Bảo trì không chọn được căn trên Desk: không tạo phiếu, không khóa phòng được (BUG-R3-053) | Bảo trì báo trên app hoặc nhắn ngày, căn, lý do; lễ tân hoặc người trực tạo phiếu, khóa phòng trên Desk (mục 13.4) |

---

## 18. Bảng giờ

| Giờ | Việc |
|---|---|
| **06:00** | Ngày mới trên Desk. Trước 06:00 vẫn là ngày hôm trước |
| 07:00 | Bắt đầu trả lời yêu cầu của khách; Desk chuyển căn có khách sang "cần dọn". Từ 07:00 hỏi chủ đầu tư/quản lý để kiểm tiền về. Form website đã bật: Desk mở trên máy quầy và điện thoại người trực tới 22:00 (mục 13.1) |
| 07:30 (từ v1.0.1) | Google Chat nhắc các yêu cầu website ban đêm còn chưa ai nhận (mục 13.1a) |
| Sáng (từ 08:00) | Nhắn khách đi hôm nay xác nhận giờ trả. Hạn khai báo khách Việt Nam đến từ 23:00 hôm trước |
| Mở quầy, muộn nhất **09:00** | Tờ **Your ID details** đúng chỗ. **Từ hôm sau ngày sổ giao ca có dòng "Thay tờ v2 hh:mm – tham số v2 hh:mm"** (hoặc từ ngày ghi ở dòng "Tờ v2 từ 06:00 dd/mm"): chân tờ có chữ v2, cả tờ trong ngăn quầy; chưa có dòng đó thì tờ v1 là đúng, **không** tự thay tờ v2 (mục 2). Rà giữ chỗ mốc 1 |
| 09:00 | Quản lý đối soát xong khoản chuyển khoản ghi ban đêm |
| **Trước 11:00** | Căn trống từ đêm qua có khách đến đã rà xong (mục 13.2a; từ v1.0.4 kiểm trên app, mục 14.2) |
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
| **Giá ước tính** | Số web tính cho khách trước khi gửi yêu cầu. Chưa giữ phòng; giá cuối là báo giá Desk (mục 13.1c) |

### 20.2 Bảng tiền hay dùng

Tham số ngày 27/10/2026. Giá, giảm theo số đêm, dài hạn, nhận sớm và phụ thu người theo bảng giá 01/11 và ESC-045, áp dụng từ ngày chủ đầu tư chuyển giá.

| Mục | Giá trị |
|---|---|
| Phụ thu nhận sớm | 06:00–09:59: 50 % · 10:00–10:59: 30 % giá đêm đầu · từ 11:00: 0 · trước 06:00: thêm 1 đêm |
| Phụ thu trả muộn | đến 12:30 (không có khách đến): 0 · đến 15:00: 30 % · đến 18:00: 50 % giá đêm cuối · sau 18:00: thêm 1 đêm hoặc bằng giá 1 đêm |
| Cuối tuần, ngày đặc biệt | Một giá mọi đêm, kể cả thứ Sáu, thứ Bảy, lễ, Tết (ESC-045, từ ngày chủ đầu tư chuyển giá). Ngày đặc biệt (vẫn ở tối thiểu 2 đêm, không hoàn cọc khi hủy): đêm 24/12/2026–01/01/2027, Tết đêm 05–10/02/2027, Giỗ Tổ đêm 16/4/2027, đêm 30/4 và 1/5/2027, đêm 1/9 và 2/9/2027 |
| Kiểm sau khi chuyển giá | Báo giá thử một Studio, ngày đến thứ Sáu, 2 đêm, 2 người lớn: phải ra 1.600.000. Ra số khác: dừng, báo quản lý, không tự sửa giá. Tới v1.0.3, đêm thứ Sáu, thứ Bảy cột **Nguồn giá** vẫn ghi "Lịch giá: thứ Sáu/thứ Bảy +15% (BR-104)": nhãn cũ, đọc số trong ô giá. Từ v1.0.4 không còn nhãn này. |
| Tối thiểu số đêm | 2 đêm khi ngày đến là thứ Sáu, thứ Bảy, ngày đặc biệt |
| Giảm theo số đêm | Không giảm theo số đêm · từ **30 đêm** là thuê tháng (hợp đồng) |
| Cọc ngắn ngày | 30 % tiền phòng · đơn Trực tiếp thu đủ khi nhận phòng |
| Giữ chỗ | 12/24/48 giờ (mặc định 24), không quá 12:00 ngày đến, gia hạn 1 lần tối đa 24 giờ · báo giá giữ giá 3 ngày |
| Hủy (Trực tiếp, CTV) | Báo trước ≥ 7 ngày hoàn 100 % cọc · 3–6 ngày 50 % · < 3 ngày không hoàn · có đêm ngày đặc biệt: không hoàn · bất khả kháng: dời ngày trong 3 tháng |
| Phụ thu người vượt định mức | Từ 6 tuổi trở lên 150.000 đ/đêm (trẻ 6–11 tuổi tính như người lớn, ESC-045) · dưới 6 tuổi miễn |
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
10. Người trực hiện nay thêm (trên Desk tập): dọn và kiểm một căn rồi bấm **Làm xong** (mục 13.2a); khi Desk tập đã lên v1.0.4: bấm **Làm xong** rồi kiểm căn đó trên app (mục 14.2); hủy một việc dọn với lý do **Khách nói không cần dọn**; tạo, nhận và đóng một phiếu sửa trên Desk (tệp 04 mục 4.4); nói được việc 22:00, 23:00 sau khi đóng quầy và cách nhận phòng khách đến sau 22:00 (mục 13.3).
11. Khi gói website LP-v2 đã lên (trên Desk tập): lọc **Yêu cầu từ website** theo **Tiếng Hàn**; dịch lời nhắn bằng Google Dịch; gửi câu mẫu 1; lập báo giá, chỉ ra ô **Ngôn ngữ gửi khách** là English và câu "Khách viết bằng tiếng Hàn – gửi tin bằng tiếng Anh."; gửi câu mẫu 3; đọc dòng **Giá ước tính khách đã thấy** và nói được việc phải làm khi hộp báo giá hiện "Khác giá web khách đã thấy: … → …" (mục 13.1c, 13.1d).
12. Khi v1.0.2 đã lên (trên Desk tập): **Trả sớm** một đơn Trực tiếp khách báo trước 1 ngày, đọc **Phí trả phòng sớm** và **Sẽ xin hoàn cho khách**, **Nhập nơi nhận hoàn**. Mở **Trả sớm** trên một đơn dài hạn nhập tay (không bấm xác nhận): nói được 4 bước B1–B4 và chọn đúng nhánh cho 3 ví dụ ở mục 11.5.3 (rời 15/02, 03/02, 25/01). Nói được việc phải ghi trước khi **Gia hạn** đơn HĐ (mục 9.3 bước 6).
