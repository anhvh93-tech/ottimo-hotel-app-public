# OTTIMO Desk – Hướng dẫn 1 trang cho nhân viên

Dành cho lễ tân và buồng phòng · Bản 30/10/2026 · v1.0.0 · Hướng dẫn đầy đủ: Sổ tay OTTIMO Desk v1.0 · In 4 tờ, mỗi tờ một mặt (cách in và chỗ dán: cuối tệp).

<!-- Lịch sử sửa (bản in bỏ qua): Lập PO + DOM. 26/10: nhận phòng từ 12:00. 27/10: kiểm phòng do lễ tân trưởng, minibar buồng phòng báo số – lễ tân nhập, in phiếu; tối 27/10 (BA theo SEC): QR "vừa đổi tài khoản nhận", mã cửa không qua tin nhắn, báo lỗi không kèm dữ liệu khách. 30/10 (PO, theo `v1.0.0`): In phiếu dùng được; rà giữ chỗ quá hạn; check-in online tạm dừng tới v1.0.1; tờ thông báo giấy tờ. 30/10 tối (PO, Phản hồi & sửa – rounds/round-03/responses/PO-to-v1.0.0-docs-reviews.md): sắp thành 4 tờ theo UXD (FB-R3-UXD-PO-DT1-04, quyết định dàn trang UXD mục 2) – chỉ chuyển chỗ; giữ chỗ quá hạn theo quyết định DOM (DOM-on-PO-v1.0.0-docs.md mục A: rà 3 mốc, sau hạn Desk v1.0.0 chỉ còn Hủy, có cọc thì để nguyên – làm lại khi khách đến; chưa cọc thì hủy ngay – tạo lại 1 lần); chỗ tìm giữ chỗ theo BA M13-02; chỉ tờ thông báo TRƯỚC khi nhận giấy tờ (SEC D01 = UXD DT1-01); câu đồng ý và tờ "Your ID details" theo chữ UXD mục 1.1–1.2 (dựa trên SEC mục B); OTTIMO hiện 1 người trực giữ 6 vai (decision-log 29/10). 30/10 khuya (PO, Phản hồi & sửa theo QA thử luồng trên staging – rounds/round-03/qa/qa3-rc1.md mục 20.7; PO-to-v1.0.0-docs-reviews.md mục 10): Tờ 2a – không dùng lý do "Khác (ghi rõ)" (BUG-R3-046), người trực nhập nơi nhận hoàn – chủ đầu tư duyệt và chi (SELF_APPROVAL_FORBIDDEN / SELF_REFUND_FORBIDDEN), đơn mới thu đủ cọc ngay khi đặt (DEPOSIT_INSUFFICIENT); cắt chữ trong cùng tờ để vừa A5 10 pt (bỏ chú thích Hôm nay/Sơ đồ phòng – đã có ở sổ tay 2.4). Tờ 1 – tách "Hoàn tiền" khỏi dòng hạn mức (hoàn không có hạn mức tự duyệt); bù chỗ bằng cách rút câu khách tới 12:00–14:00. Tờ 4 không đổi. -->
<!-- PO 27/10 (L2 trong rounds/round-03/outputs/BA/manual-report.md), QA xác nhận Q6, Q7 (rounds/round-03/qa/manual-check.md): phần buồng phòng đúng với v1.0.0 (8b3aec8) – hk_self_inspection_enabled = false, nút kiểm phòng chỉ cho vai lễ tân trưởng trở lên; app nhân viên không có màn đếm minibar. Căn cứ BR-401 v0.4.6, BR-415, BR-802. -->

---

## Tờ 1 – Quầy lễ tân

<!-- A4 một mặt, 2 cột, Be Vietnam Pro 9 pt. Dán phía trong quầy, chỗ nhân viên – không để khách đọc (SEC D06). -->

Desk (máy quầy): `desk.ottimo.vn` · App buồng phòng (điện thoại): `staff.ottimo.vn`

**Hiện OTTIMO có một người trực quầy, giữ cả 6 vai.** Chỗ nào ghi "lễ tân trưởng" hay "quản lý" là chính bạn, làm bằng quyền của vai đó và luôn ghi lý do. Chủ đầu tư xem lại mỗi sáng. Khi OTTIMO có thêm lễ tân, việc rà làm ở đầu mỗi ca và việc quyết đơn có cọc thiếu chuyển về quản lý.

### Luôn nhớ
- **Mỗi người một tài khoản.** Không dùng chung, không đọc mật khẩu qua điện thoại, không gõ mật khẩu cho người khác. Rời máy thì đăng xuất.
- **Giấy tờ khách chỉ nằm trên Desk.** Không chụp, không gửi qua Zalo, không lưu trên điện thoại cá nhân.
- **Mã cửa không gửi qua Zalo, tin nhắn, email hay ảnh**, kể cả gõ tay. Chỉ đọc tại quầy, hoặc lễ tân **tự gọi ra** số điện thoại trên đơn – khi khách đã nhận phòng trên Desk, có giấy tờ, đã thu đủ. Không đọc mã cho người gọi đến. Không mở cửa căn cho người tự nhận là khách.
- **Ngày trên Desk đổi lúc 06:00**, không phải 00:00. Từ 00:00 đến 05:59 vẫn là ngày hôm trước.
- Ba ngày đầu: ghi thêm **sổ giấy** (đơn, thu tiền), đối chiếu lúc 22:00.

### Giờ cần nhớ
| Giờ | Việc |
|---|---|
| 06:00 | Ngày mới trên Desk |
| 12:00 | Giờ trả phòng. Trả muộn: Desk tự tính phụ thu theo giờ |
| 12:00 | **Nhận phòng từ 12:00** nếu căn đã sẵn sàng (đã dọn hoặc đã kiểm – `VC`/`VI`), **không** phụ thu. Nhận trước 12:00: Desk tự tính phụ thu (khách OTA: chỉ thu khi kênh đó đã đăng giờ nhận 12:00 – xem danh sách kênh chủ đầu tư đưa) |
| 14:00 | Mọi căn có khách đến hôm nay **chắc chắn sẵn sàng** |
| 18:00 | Khách chưa đến, chưa báo giờ: gọi hoặc nhắn khách |
| 23:00 | Vẫn không liên lạc được: đánh dấu "Không đến". Hạn khai báo lưu trú khách Việt Nam (đến từ 23:00 thì trước 08:00 hôm sau) |
| +12 giờ | Hạn khai báo khách nước ngoài, tính từ giờ nhận phòng |

### Lễ tân
**Mở quầy:** mở **Hôm nay** → xem khách đến, khách đi, **Cần chú ý**. Xử lý từ dòng đỏ trở xuống. Tới v1.0.1: rà giữ chỗ theo **Tờ 2a**.

**Đặt phòng:** từ **Sơ đồ phòng** hoặc **Đơn đặt phòng**. Đơn Trực tiếp, CTV bắt buộc có số điện thoại và nguồn. Đơn OTA mới: nhập Desk **ngay**, rồi đóng phòng trên extranet các kênh khác.

**Cọc:** gửi khách mã VietQR từ đơn, **từ điện thoại của cơ sở** (không mở Zalo trên máy quầy). Nội dung chuyển khoản là mã đơn. Chỉ bấm **Xác nhận đã nhận cọc** khi thấy tiền về tài khoản của OTTIMO, và bấm **trước giờ hạn** giữ chỗ. Khách chuyển thiếu: gọi ngay xin phần còn lại trước hạn. Thấy **Giữ chỗ sắp hết hạn**: gọi khách; cần thêm giờ thì **Gia hạn giữ chỗ (1 lần)** ngay – sau hạn không gia hạn được.

**Mã VietQR hiện dòng "Tài khoản nhận vừa đổi":** **chưa cho khách chuyển**. Gọi điện cho chủ đầu tư (số đã lưu ở điện thoại cơ sở) xác nhận trước; chủ đầu tư đồng ý mới tiếp. Không gọi được thì mời khách trả tiền mặt hoặc thẻ.

**Giờ nhận phòng nói với khách:** "Nhận phòng từ 12:00. Phòng luôn sẵn sàng lúc 14:00." (EN: "Check-in is from 12:00. Your room is always ready by 14:00."). **Không** hứa "phòng sẵn sàng từ 12:00". Khách tới 12:00–14:00 mà căn chưa xong: giữ hành lý, hẹn giờ; không phụ thu, không giảm giá. Quá 14:00 vẫn chưa xong: đổi căn sẵn sàng hoặc nâng hạng (quyền lễ tân trưởng, quản lý), ghi lý do.

**Nhận phòng:** buồng đã sạch; đã thu đủ phần còn lại (đơn trực tiếp); có giấy tờ người đứng tên **trước khi** giao mã cửa. **Trước khi nhận giấy tờ**, chỉ khách tờ **Your ID details** trên quầy: "Before I take your ID, please read this note on how we use it." / "Trước khi nhận giấy tờ, mời anh/chị đọc tờ này về cách chúng tôi dùng thông tin." Rồi nhập giấy tờ ở bước Giấy tờ, khai báo lưu trú và đánh dấu "đã khai" ở **Giấy tờ & khai báo** trước hạn.

**Hỏi khách đồng ý lưu ảnh giấy tờ** – ở Khối 1 "Đối chiếu và đồng ý lưu ảnh". Chỉ hỏi khi có chụp ảnh giấy tờ, hỏi từng người lớn được chụp. Khách đang ở lúc chuyển đổi ngày D không chụp lại ảnh, không hỏi. Đọc đúng số ngày N Desk hiện. Gọi khách là "anh" hoặc "chị", không đọc "anh/chị".
- EN: "May we keep photos of your ID for N days after check-out? They are then deleted automatically. If you'd rather not, that's fine – we use them only to register your stay, then delete them."
- VI: "Anh/chị có đồng ý cho OTTIMO lưu ảnh giấy tờ N ngày sau khi trả phòng không? Sau đó ảnh tự xóa. Anh/chị không đồng ý cũng không sao, chúng tôi chỉ dùng ảnh để khai báo lưu trú rồi xóa."
- Ghi câu trả lời trên Desk. Khách không đồng ý vẫn ở bình thường. Khách không đọc được tờ EN/VI: đọc to câu hạn lưu (đoạn 3 của tờ).

**Trả phòng – 3 bước:** minibar (nhập **số còn lại** từng món theo số buồng phòng báo) → phụ phí → bill & thu tiền. Khách chưa trả đủ: ghi công nợ bằng quyền quản lý.

**Phiếu thanh toán:** khung đơn đã trả phòng → **Xem Phiếu thanh toán** → chọn **Tiếng Việt** hoặc **Việt – Anh**. Bấm **In phiếu** → hộp in của trình duyệt in một tờ A4. Khách cần bản điện tử: chọn "Lưu dưới dạng PDF" trong hộp in rồi gửi riêng 1–1 cho khách. Không chụp màn hình phiếu gửi qua chat.

**Miễn, giảm, xóa nợ:** trong hạn mức của bạn thì Desk áp ngay, luôn ghi lý do. Vượt hạn mức: gửi yêu cầu, người có quyền duyệt ở **Cần duyệt** bằng tài khoản của chính mình. **Hoàn tiền:** người tạo yêu cầu không tự duyệt, không tự chi – hiện chủ đầu tư duyệt và chi. **Không** gõ mật khẩu người khác vào màn của bạn.

**Kiểm phòng (vai lễ tân trưởng):** đăng nhập `staff.ottimo.vn` trên điện thoại. Nhận thông báo **Căn đã dọn – chờ kiểm** → mở căn → **Kiểm phòng** → đi hết danh mục → **Kiểm đạt – sẵn sàng**, hoặc **Chưa đạt** (ghi chỗ chưa đạt; căn quay về cần dọn). Căn trống từ đêm qua có khách đến hôm nay: kiểm xong **trước 12:00**.

**Trước khi rời quầy:** "Cần chú ý" không còn dòng đỏ chưa xử lý. Ba ngày đầu: so sổ giấy với Desk lúc 22:00.

### Khi có sự cố
- **Mất mạng:** thử 4G điện thoại của cơ sở phát Wi-Fi cho máy quầy → app trên điện thoại cơ sở → sổ giấy. Chưa xem được phòng trống thì không nhận đơn mới, ghi số điện thoại và hẹn gọi lại. Có mạng lại thì nhập bù trong 24 giờ, ghi giờ thật.
- **Desk báo lỗi, tính sai tiền, không làm tiếp được:** ghi bằng lời căn, mã đơn, giờ, đã bấm gì, Desk báo gì và mã tham chiếu. **Không** ghi tên, số điện thoại, số giấy tờ của khách; **không** chụp màn hình có dữ liệu khách để gửi đi. Báo chủ đầu tư. Không đặt được, không nhận/trả phòng được hay sai tiền là lỗi "P0", đội sửa trong ngày; trong lúc chờ, ghi sổ giấy.

---

## Tờ 2a – Tạm tới bản v1.0.1

<!-- A5 một mặt, 10 pt, viền Light Oak. Dán cạnh Tờ 1, phía nhân viên. Gỡ khi chủ đầu tư báo hết tạm cả hai khối. Điều kiện bỏ khối giữ chỗ: v1.0.1 có đủ V1, V2, V4 (DOM A.3a) và QA thử lại cả ba lối ra BR-303 trước và sau hạn (DOM-09). Điều kiện bỏ khối check-in: SEC-on-PO-v1.0.0-docs.md mục C.1 + v1.0.0-docs-update.md mục 2.1. -->

**Gỡ tờ này khi chủ đầu tư báo cả hai việc dưới đây đã hết tạm.**

**Rà giữ chỗ – 3 mốc mỗi ngày** (Desk chưa báo giữ chỗ quá hạn vào **Cần chú ý**)
- **Khi nào:** lúc mở quầy (muộn nhất 09:00) · **11:00** · trước khi rời quầy (muộn nhất 21:00) · mỗi lần thấy **Giữ chỗ sắp hết hạn**.
- **Ở đâu:** **Đơn đặt phòng** → lọc **Đang hiệu lực** → mở từng dòng **Giữ chỗ · chờ cọc**.
- **Còn dưới 2 giờ:** xử lý **trước hạn** – thu đủ rồi xác nhận, gia hạn 1 lần, hoặc hủy (Tờ 1, dòng Cọc).
- **Đã "còn 0 giờ 00 phút" đỏ** ("0h00"): Desk chỉ còn **Hủy giữ chỗ**. Không bấm xác nhận cọc, không tạo đơn mới chồng lên. Khung đơn ghi "đơn đã tự hủy" mà trạng thái vẫn **Giữ chỗ · chờ cọc**: đơn **chưa** hủy.
  - **Lý do hủy:** **Không liên lạc được** hoặc **Khách đổi ý**. **Không chọn Khác (ghi rõ)**: Desk khóa nút hủy.
  - **Chưa cọc:** hủy ngay, rồi báo khách (đơn CTV: báo CTV trước). Khách còn muốn: đến từ ngày mai → tạo giữ chỗ mới **12 h**, chỉ một lần; đến hôm nay → gửi VietQR, tạo đơn khi tiền về.
  - **Đã có cọc:** gọi khách. Không đi, hoặc không liên lạc được tới 11:00 ngày đến → hủy; Desk vẫn tạo yêu cầu hoàn đủ (dù hộp ghi "không thu phí"). Bạn nhập nơi nhận; **chủ đầu tư duyệt và chi**, bạn không tự duyệt được. Vẫn đi → **để nguyên đơn**, báo khách phần còn lại trả khi nhận phòng. Khách đến: hủy đơn cũ → đặt đơn mới cùng căn, cùng giá, **thu đủ cọc ngay** → nhận phòng, thu phần còn lại → chủ đầu tư hoàn cọc cũ, vắng thì hẹn khách (sổ tay 2.4).
- **Sổ giao ca:** mỗi đơn đã xử lý một dòng: mã đơn, đã làm gì, lý do thật. Đơn để nguyên: "OTM-… Giữ – cọc thiếu …, thu khi đến – [người quyết] dd/mm". Không ghi tên khách.
- **Trước khi rời quầy:** mọi giữ chỗ 0h00 đỏ đã hủy, hoặc đã có dòng "Giữ – …" trong sổ giao ca.

**Check-in online – tạm dừng từ 02/11**
- **Không tạo, không gửi** link check-in online cho khách thật. Mọi khách làm giấy tờ tại quầy. Khách muốn gửi yêu cầu trong lúc ở: nhắn Zalo hoặc gọi lễ tân.
- **Lỡ gửi link:** mở đơn → **Thu hồi link** ngay. Ghi **mã đơn** vào sổ giao ca (không ghi tên khách), báo chủ đầu tư trong ngày. Khách tới quầy thì chỉ tờ **Your ID details** như mọi khách.

---

## Tờ 2b – Khách ở quá 18:00 mà đêm đó căn đã bán

<!-- A5 một mặt, 10 pt. In chung một tờ A4 với 2a rồi cắt đôi. Kẹp sau Tờ 1 hoặc trong bìa quầy. Không gỡ khi v1.0.1 lên. -->

1. Phòng trước: từ 12:00, chốt giờ đi với khách đi hôm nay nếu căn có khách đến tối nay.
2. Khách vẫn ở quá 18:00: đổi căn cho **khách sắp đến** sang căn trống khác (quyền lễ tân trưởng, quản lý; cùng hạng trước, lý do "OTTIMO đổi căn"). Khi đó Desk tính thêm 1 đêm cho khách ở quá giờ như thường.
3. Không còn căn trống: **gọi chủ đầu tư** báo trước. Không chờ duyệt, không xin mật khẩu. Trên Desk chọn **"Ghi phụ thu – quản lý xem lại"**: Desk hiện số bằng giá 1 đêm của đêm đó, không sửa được, không có ô miễn. Ghi lý do (ví dụ "Rời 20:30, căn có khách đến tối nay"), thu đủ số Desk hiện, hoàn tất trả phòng.
4. Khách xin giảm: không hứa. Nói OTTIMO xem lại trong 24 giờ, nếu được giảm OTTIMO sẽ hoàn lại. Khách không chịu trả: không hoàn tất trả phòng, gọi chủ đầu tư.
5. Xem lại (chủ đầu tư, hoặc quản lý): trong 24 giờ mở **Cần chú ý**. Đồng ý thì bấm "Đã xem". Nên giảm thì sửa dòng phụ thu trên bill, Desk tự tạo yêu cầu hoàn; chủ đầu tư duyệt hoàn. Quá 24 giờ, bill đóng, không sửa được nữa.

---

## Tờ 3 – Buồng phòng (điện thoại)

<!-- A4 một mặt, 10 pt. Dán ở phòng buồng / kho đồ vải. -->

App buồng phòng: `staff.ottimo.vn`

### Luôn nhớ
- **Mỗi người một tài khoản.** Không dùng chung, không đọc mật khẩu qua điện thoại, không gõ mật khẩu cho người khác. Rời máy thì đăng xuất.
- **Giấy tờ khách chỉ nằm trên Desk.** Không chụp, không gửi qua Zalo, không lưu trên điện thoại cá nhân.
- **Mã cửa không gửi qua Zalo, tin nhắn, email hay ảnh**, kể cả gõ tay. Không đọc mã cho người gọi đến. Không mở cửa căn cho người tự nhận là khách.

### Việc hằng ngày
- Mở **Việc của tôi**, làm từ trên xuống. Mỗi căn: **Bắt đầu dọn** → **Dọn xong**. Căn trống chuyển **Đã dọn – chờ kiểm**; **lễ tân trưởng kiểm** rồi báo sẵn sàng. Ở v1.0 buồng phòng **không tự kiểm**. Desk cập nhật ngay.
- **Căn có khách đến hôm nay:** căn trống từ đêm qua → rà lại đầu ca sáng, dọn nếu cần, để lễ tân trưởng kiểm xong **trước 12:00**. Căn khách trả rồi khách mới đến cùng ngày → dọn ngay khi khách trả, bấm **Dọn xong** sớm để căn **sẵn sàng trước 14:00**. Bộ đồ dùng cho người ở thêm: xong trước 12:00.
- **Các căn**: xem trạng thái mọi căn.
- **Khách trả phòng – minibar:** lễ tân báo căn sắp trả → đếm tủ → **báo lễ tân số còn lại từng món** (gọi hoặc nói trực tiếp; tin nhắn nội bộ chỉ ghi số căn và số món, không ghi tên khách). App chưa có màn đếm minibar; lễ tân nhập vào Desk.
- Việc **Bổ sung minibar**: bổ sung xong bấm **Làm xong**.
- Hỏng hóc: **báo sự cố** kèm ảnh hỏng hóc (không chụp khách, không chụp giấy tờ). Căn không ở được thì báo lễ tân khóa bán.
- Đồ khách để quên: báo lễ tân ngay.
- Không thấy giấy tờ của khách trên app: đúng như thiết kế.
- **Không mở cửa căn** cho người nói mình là khách ("quên mã, mở giúp"), kể cả khi họ biết tên khách. Mời ra quầy hoặc gọi lễ tân.
- Trả máy hoặc nghỉ việc: bấm **Đăng xuất** (xóa dữ liệu đã lưu trên máy).

### Khi có sự cố
- **Mất mạng:** app vẫn bấm được; thao tác tự gửi khi có mạng. Đừng xóa dữ liệu trình duyệt.
- **App báo lỗi, không làm tiếp được:** ghi bằng lời căn, giờ, đã bấm gì, app báo gì. **Không** ghi tên khách, **không** chụp màn hình có dữ liệu khách để gửi đi. Báo lễ tân hoặc chủ đầu tư.

---

## Tờ 4 – Your ID details (khách đọc)

<!-- A5 dọc, một mặt, quy cách ở rounds/round-03/reviews/UXD-on-PO-v1.0.0-docs.md mục 1.3 (EN 11,5 pt / VI 11 pt, Lora tiêu đề, Be Vietnam Pro thân, chỉ Ink – Stone Grey – Light Oak trên giấy trắng hoặc ngà, không emoji). Đặt trong khung mica trên quầy, mặt quay ra khách, chỗ khách đứng làm thủ tục, không bị che (SEC S2). Dán trước khi nhận giấy tờ đầu tiên trên Desk thật: tối 01/11 sau buổi đào tạo, muộn nhất 06:00 ngày 02/11 (SEC D04). Chữ: UXD mục 1.2, dựa trên SEC mục B; đủ 6 ý SEC. Đoạn 1 = gw.notice_body v1 (privacy-2026-10-v1) nguyên văn; đoạn 3 câu đầu = SEC-sprint1.md 5.2. Đổi chữ thì đổi dòng chân trang và giữ bản cũ trong lịch sử repo (SEC D08). Khi v1.0.1 lên, tờ này vẫn dùng cho khách làm giấy tờ tại quầy. Bản RU: chưa thêm tới khi có bản dịch v2 đã duyệt (UXD trả lời SEC D07). -->

OTTIMO

**Your ID details**
*Thông tin giấy tờ của bạn*

OTTIMO uses your ID details to register your stay with the police, as required by Vietnamese law. ID photos are encrypted; only reception and managers can see them.

We will ask separately whether we may keep your ID photos after registration. Saying no does not affect your stay.

ID photos and saved ID details are deleted within 3 months after check-out, unless the law requires us to keep them longer. Copies in our encrypted backups are deleted within a further 35 days.

To see, correct or delete your details, please ask reception.

---

OTTIMO dùng thông tin giấy tờ của bạn để khai báo lưu trú với cơ quan công an theo luật Việt Nam. Ảnh giấy tờ được mã hóa; chỉ lễ tân và quản lý xem được.

Chúng tôi sẽ hỏi riêng bạn có muốn cho lưu ảnh giấy tờ sau khi khai báo hay không. Bạn không đồng ý cũng không ảnh hưởng gì tới việc lưu trú.

Ảnh và thông tin giấy tờ được xóa trong vòng 3 tháng sau khi trả phòng, trừ phần pháp luật yêu cầu lưu lâu hơn. Bản sao trong dữ liệu sao lưu đã mã hóa được xóa trong 35 ngày sau đó.

Muốn xem, sửa hoặc xóa thông tin của bạn, vui lòng hỏi lễ tân.

OTTIMO · ID notice · 11/2026

---

## Cách in và dán (cho chủ đầu tư)

| Tờ | Khổ | Dán ở đâu | Khi v1.0.1 lên |
|---|---|---|---|
| 1 – Quầy lễ tân | A4 một mặt | Phía trong quầy, chỗ nhân viên (khách không đọc được) | Giữ |
| 2a – Tạm tới v1.0.1 | A5 (in chung A4 với 2b, cắt đôi) | Cạnh Tờ 1 | Gỡ khi chủ đầu tư báo hết tạm |
| 2b – Khách ở quá 18:00 | A5 | Kẹp sau Tờ 1 hoặc trong bìa quầy | Giữ |
| 3 – Buồng phòng | A4 một mặt | Phòng buồng / kho đồ vải | Giữ |
| 4 – Your ID details | A5 dọc một mặt | Khung mica trên quầy, mặt quay ra khách | Giữ |

Không in hai mặt. In thử Tờ 4 dưới đèn quầy trước khi dán. Tờ 4 phải ở quầy trước khi nhận giấy tờ đầu tiên trên Desk thật: tối 01/11 sau buổi đào tạo, muộn nhất **06:00 ngày 02/11**.
