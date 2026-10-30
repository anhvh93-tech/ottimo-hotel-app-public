# OTTIMO Desk – Hướng dẫn 1 trang cho nhân viên

Dành cho lễ tân và buồng phòng · v1.0 · tháng 11/2026 · Lập: PO + DOM · Sửa 26/10: nhận phòng từ 12:00 · Sửa 27/10: kiểm phòng do lễ tân trưởng, minibar buồng phòng báo số – lễ tân nhập, in phiếu; tối 27/10 (BA theo SEC): QR "vừa đổi tài khoản nhận", mã cửa không qua tin nhắn, báo lỗi không kèm dữ liệu khách · **Sửa 30/10 (PO, theo bản `v1.0.0`)**: In phiếu đã dùng được; rà giữ chỗ "0h00" đỏ đầu mỗi ca; check-in online tạm dừng tới v1.0.1; tờ thông báo giấy tờ ở quầy. In một mặt giấy A4, dán ở quầy; tờ thông báo giấy tờ (cuối trang) in riêng, dán chỗ khách đọc được. Hướng dẫn đầy đủ: **Sổ tay sử dụng OTTIMO Desk v1.0** (chủ đầu tư giữ).

<!-- PO 30/10: QA đã xác nhận Q6, Q7 trên staging (rounds/round-03/qa/manual-check.md) – phần buồng phòng dưới đây đúng với v1.0.0 (8b3aec8). Mục "Đầu ca" và "Check-in online" theo BUG-R3-041, FB-R3-ARC-BEB-WA-04, quyết định D-T4 (rounds/round-03/outputs/PO/v1.0.0-docs-update.md). CHỜ DOM xác nhận cách xử lý giữ chỗ quá hạn, UXD duyệt chữ tờ thông báo giấy tờ, SEC xác nhận D-T4 và tờ thông báo. -->
<!-- PO 27/10 (L2 trong rounds/round-03/outputs/BA/manual-report.md): phần buồng phòng viết theo mã v1.0.0-rc.3 – hk_self_inspection_enabled = false (production-defaults.ts), nút kiểm phòng chỉ cho lễ tân trưởng trở lên; app nhân viên không có màn đếm minibar (chỉ việc "Bổ sung minibar"). Khớp sổ tay mục 2.14, 3.6, 3.7. CHỜ QA xác nhận trên staging Q6 (minibar) và Q7 (lễ tân trưởng thấy nút Kiểm phòng, buồng phòng không thấy) ở rounds/round-03/qa/manual-check.md. Nếu khác: PO sửa trước khi INV in ngày D−1 (01/11). Căn cứ BR-401 v0.4.6, BR-415, BR-802. -->


Desk (máy quầy): `desk.ottimo.vn` · App buồng phòng (điện thoại): `staff.ottimo.vn`

## Luôn nhớ
- **Mỗi người một tài khoản.** Không dùng chung, không đọc mật khẩu qua điện thoại, không gõ mật khẩu cho người khác. Rời máy thì đăng xuất.
- **Giấy tờ khách chỉ nằm trên Desk.** Không chụp, không gửi qua Zalo, không lưu trên điện thoại cá nhân.
- **Mã cửa không gửi qua Zalo, tin nhắn, email hay ảnh**, kể cả gõ tay. Chỉ đọc tại quầy, hoặc lễ tân **tự gọi ra** số điện thoại trên đơn – khi khách đã nhận phòng trên Desk, có giấy tờ, đã thu đủ. Không đọc mã cho người gọi đến. Không mở cửa căn cho người tự nhận là khách.
- **Ngày trên Desk đổi lúc 06:00**, không phải 00:00. Từ 00:00 đến 05:59 vẫn là ngày hôm trước.
- Ba ngày đầu: ghi thêm **sổ giấy** (đơn, thu tiền), đối chiếu lúc 22:00.

## Giờ cần nhớ
| Giờ | Việc |
|---|---|
| 06:00 | Ngày mới trên Desk |
| 12:00 | Giờ trả phòng. Trả muộn: Desk tự tính phụ thu theo giờ |
| 12:00 | **Nhận phòng từ 12:00** nếu căn đã sẵn sàng (đã dọn hoặc đã kiểm – `VC`/`VI`), **không** phụ thu. Nhận trước 12:00: Desk tự tính phụ thu (khách OTA: chỉ thu khi kênh đó đã đăng giờ nhận 12:00 – hỏi lễ tân trưởng) |
| 14:00 | Mọi căn có khách đến hôm nay **chắc chắn sẵn sàng** |
| 18:00 | Khách chưa đến, chưa báo giờ: gọi hoặc nhắn khách |
| 23:00 | Vẫn không liên lạc được: đánh dấu "Không đến". Hạn khai báo lưu trú khách Việt Nam (đến từ 23:00 thì trước 08:00 hôm sau) |
| +12 giờ | Hạn khai báo khách nước ngoài, tính từ giờ nhận phòng |

## Lễ tân
**Đầu ca:** mở **Hôm nay** → xem khách đến, khách đi, **Cần chú ý**. Xử lý từ dòng đỏ trở xuống.

**Đầu mỗi ca – giữ chỗ "0h00" đỏ** (tới bản v1.0.1, Desk chưa báo giữ chỗ quá hạn vào **Cần chú ý**): mở **Sơ đồ phòng** và **Hôm nay**, tìm mọi giữ chỗ có đồng hồ **0h00 màu đỏ**. Xử lý hết trước 12:00 ngày đến:
- **Đã có cọc (đủ hoặc thiếu):** gọi khách. Khách chuyển đủ → kiểm tiền về rồi **Xác nhận đã nhận cọc**. Khách chỉ trả được một phần → báo quản lý: quản lý chấp nhận cọc thiếu (ghi lý do) hoặc hủy và hoàn 100 % số đã nhận (quản lý duyệt hoàn). Không tự hủy đơn có cọc.
- **Chưa cọc mà vẫn còn sau hạn** (thường là đơn có yêu cầu giảm giá hoặc FOC – Desk không tự hủy được): gọi khách. Khách không giữ nữa → **Hủy giữ chỗ** bằng tay, không phí.
- Ghi vào sổ giao ca: mã đơn, đã làm gì. Quá 12:00 ngày đến chưa xong → báo quản lý.

**Đặt phòng:** từ **Sơ đồ phòng** hoặc **Đơn đặt phòng**. Đơn Trực tiếp, CTV bắt buộc có số điện thoại và nguồn. Đơn OTA mới: nhập Desk **ngay**, rồi đóng phòng trên extranet các kênh khác.

**Cọc:** gửi khách mã VietQR từ đơn. Nội dung chuyển khoản là mã đơn. Chỉ bấm "Đã nhận cọc" khi thấy tiền về tài khoản của OTTIMO.

**Mã VietQR hiện dòng "Tài khoản nhận vừa đổi":** **chưa cho khách chuyển**. Gọi điện cho chủ đầu tư (số đã lưu ở điện thoại cơ sở) xác nhận trước; chủ đầu tư đồng ý mới tiếp. Không gọi được thì mời khách trả tiền mặt hoặc thẻ.

**Giờ nhận phòng nói với khách:** "Nhận phòng từ 12:00, phòng luôn sẵn sàng lúc 14:00" (EN: "Check-in from 12:00, your room is always ready by 14:00"). **Không** hứa "phòng sẵn sàng từ 12:00". Khách tới 12:00–14:00 mà căn chưa xong: giữ hành lý, mời chờ ở sảnh hoặc đi dạo, hẹn giờ; không phụ thu, không giảm giá. Quá 14:00 vẫn chưa xong: báo lễ tân trưởng hoặc quản lý đổi căn sẵn sàng hoặc nâng hạng.

**Nhận phòng:** buồng đã sạch; đã thu đủ phần còn lại (đơn trực tiếp); có giấy tờ người đứng tên **trước khi** giao mã cửa. Nhập giấy tờ ở bước Giấy tờ, rồi khai báo lưu trú và đánh dấu "đã khai" ở **Giấy tờ & khai báo** trước hạn.

**Check-in online – tạm dừng từ 02/11 tới khi chủ đầu tư báo mở lại (bản v1.0.1):** **không tạo, không gửi** link check-in online cho khách thật. Mọi khách làm giấy tờ tại quầy. Khách muốn gửi yêu cầu trong lúc ở: nhắn Zalo hoặc gọi lễ tân.

**Hỏi khách đồng ý lưu ảnh giấy tờ** (Desk hiện số ngày N ở câu hỏi đồng ý – đọc đúng số đó):
- EN: "May we keep a photo of your ID for N days after check-out? It is then deleted automatically. If you prefer not, we use it only for your registration, then delete it."
- VI: "Anh/chị có đồng ý để OTTIMO lưu ảnh giấy tờ N ngày sau khi trả phòng không? Sau đó ảnh tự xóa. Nếu không, chúng tôi chỉ dùng để khai báo lưu trú rồi xóa ảnh."
- Rồi chỉ khách **tờ thông báo giấy tờ** dán ở quầy (cuối trang này). Khách không đồng ý vẫn ở được bình thường.

**Trả phòng – 3 bước:** minibar (nhập **số còn lại** từng món theo số buồng phòng báo) → phụ phí → bill & thu tiền. Khách chưa trả đủ: quản lý ghi công nợ trên tài khoản của quản lý.

**Phiếu thanh toán:** khung đơn đã trả phòng → **Xem Phiếu thanh toán** → chọn **Tiếng Việt** hoặc **Việt – Anh**. Bấm **In phiếu** → hộp in của trình duyệt in một tờ A4. Khách cần bản điện tử: chọn "Lưu dưới dạng PDF" trong hộp in rồi gửi riêng 1–1 cho khách. Không chụp màn hình phiếu gửi qua chat.

**Miễn, giảm, xóa nợ, hoàn tiền:** trong hạn mức của bạn thì Desk áp ngay, luôn ghi lý do. Vượt hạn mức: gửi yêu cầu, quản lý duyệt ở **Cần duyệt** bằng tài khoản của chính quản lý. **Không** gõ mật khẩu quản lý vào màn của bạn: Desk sẽ từ chối.

**Khi khách ở quá 18:00 mà đêm đó căn đã bán cho khách khác:**
1. Phòng trước: từ 12:00, chốt giờ đi với khách đi hôm nay nếu căn có khách đến tối nay.
2. Khách vẫn ở quá 18:00: lễ tân trưởng hoặc quản lý đổi căn cho **khách sắp đến** sang căn trống khác (cùng hạng trước, lý do "OTTIMO đổi căn"). Khi đó Desk tính thêm 1 đêm cho khách ở quá giờ như thường.
3. Không còn căn trống: **gọi quản lý** (không được thì chủ đầu tư) báo trước. Không chờ duyệt, không xin mật khẩu. Trên Desk chọn **"Ghi phụ thu – quản lý xem lại"**: Desk hiện số bằng giá 1 đêm của đêm đó, không sửa được, không có ô miễn. Ghi lý do (ví dụ "Rời 20:30, căn có khách đến tối nay"), thu đủ số Desk hiện, hoàn tất trả phòng.
4. Khách xin giảm: không hứa. Nói quản lý xem lại trong 24 giờ, nếu được giảm OTTIMO sẽ hoàn lại. Khách không chịu trả: không hoàn tất trả phòng, gọi quản lý hoặc chủ đầu tư.
5. Quản lý: trong 24 giờ mở **Cần chú ý**. Đồng ý thì bấm "Đã xem". Nên giảm thì sửa dòng phụ thu trên bill, Desk tự tạo yêu cầu hoàn; chủ đầu tư duyệt hoàn. Quá 24 giờ, bill đóng, không sửa được nữa.

**Lễ tân trưởng – kiểm phòng:** đăng nhập `staff.ottimo.vn` trên điện thoại. Nhận thông báo **Căn đã dọn – chờ kiểm** → mở căn → **Kiểm phòng** → đi hết danh mục → **Kiểm đạt – sẵn sàng**, hoặc **Chưa đạt** (ghi chỗ chưa đạt; căn quay về cần dọn). Căn trống từ đêm qua có khách đến hôm nay: kiểm xong **trước 12:00**.

**Cuối ca:** "Cần chú ý" không còn dòng đỏ chưa xử lý; không còn giữ chỗ "0h00" đỏ chưa bàn giao. Ba ngày đầu: so sổ giấy với Desk lúc 22:00.

## Buồng phòng (điện thoại)
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

## Khi có sự cố
- **Mất mạng:** thử 4G điện thoại của cơ sở phát Wi-Fi cho máy quầy → app trên điện thoại cơ sở → sổ giấy. Chưa xem được phòng trống thì không nhận đơn mới, ghi số điện thoại và hẹn gọi lại. Có mạng lại thì nhập bù trong 24 giờ, ghi giờ thật.
- **Desk báo lỗi, tính sai tiền, không làm tiếp được:** ghi bằng lời căn, mã đơn, giờ, đã bấm gì, Desk báo gì và mã tham chiếu. **Không** ghi tên, số điện thoại, số giấy tờ của khách; **không** chụp màn hình có dữ liệu khách để gửi đi. Báo lễ tân trưởng → quản lý → chủ đầu tư. Không đặt được, không nhận/trả phòng được hay sai tiền là lỗi "P0", đội sửa trong ngày; trong lúc chờ, ghi sổ giấy.

---

## Tờ thông báo giấy tờ – in riêng, dán ở quầy chỗ khách đọc được

<!-- Chữ hướng tới khách: CHỜ UXD duyệt theo brand OTTIMO (Lora tiêu đề, Be Vietnam Pro nội dung, chỉ màu trong bảng 80/15/5, không emoji) và SEC xác nhận nội dung (SEC-sprint1.md 5.2). Hai câu đầu lấy từ chuỗi gw.notice_body đã duyệt (privacy-2026-10-v1); câu hạn lưu là câu SEC đề xuất cho privacy-2026-10-v2. Khi v1.0.1 lên, tờ này vẫn dùng cho khách làm giấy tờ tại quầy. -->

**Your ID details** · *Thông tin giấy tờ của bạn*

OTTIMO uses your ID details to register your stay with the police, as required by Vietnamese law. ID photos are encrypted; only reception and managers can see them. ID photos and saved ID details are deleted within 3 months after check-out, unless the law requires us to keep them longer. We will ask separately whether we may keep your ID photo after registration.

*OTTIMO dùng thông tin giấy tờ của bạn để khai báo lưu trú với cơ quan công an theo luật Việt Nam. Ảnh giấy tờ được mã hóa; chỉ lễ tân và quản lý xem được. Ảnh và thông tin giấy tờ được xóa trong vòng 3 tháng sau khi trả phòng, trừ phần pháp luật yêu cầu lưu lâu hơn. Chúng tôi sẽ hỏi riêng bạn có muốn cho lưu ảnh giấy tờ sau khi khai báo hay không.*
