# Demo lần 1 – Điều đã biết chưa xong và giới hạn của bản demo

> Người soạn: UXR · 17/10/2026 · v1.2 (v1.1: bổ sung sau khi UXR tự bấm đủ 10 kịch bản, 17/10 trưa; v1.2: UXR đi lại sau vòng sửa 9, 17/10 chiều – bỏ 9 lỗi đã sửa ở mục C, thêm lỗi mới thấy khi đi lại) · Đọc 2 phút **trước** khi làm theo `demo-1-guide.md`. Những điều dưới đây **không cần ghi vào phiếu** – trừ khi anh/chị muốn đổi thứ tự ưu tiên.

## A. Giới hạn của bản demo (cách dựng, không phải lỗi)
| Giới hạn | Nghĩa là |
|---|---|
| **Chỉ chạy trên máy Mac này** (localhost) | Điện thoại, máy khác không mở được, kể cả cùng Wi-Fi. Muốn xem cỡ điện thoại: Chrome → Cmd+Option+I → biểu tượng điện thoại. Thử trên điện thoại thật cần máy chủ chạy thử (staging) – đang chờ anh/chị báo VPS + tên miền. |
| **Dữ liệu giả**, dựng quanh ngày chạy lệnh | Không nhập dữ liệu thật của khách (CCCD, hộ chiếu, SĐT, số tài khoản). Sang ngày khác hoặc muốn làm lại: chạy lệnh làm mới (xóa mọi thao tác đã làm). |
| **Đồng hồ thật** | Giữ chỗ đếm ngược thật và có thể tự hết hạn trong lúc thử (D5 hết hạn khoảng 5 giờ sau lúc chạy lệnh – bản đang chạy dựng lại lúc 14:20 ngày 17/10 nên D5 hết hạn 19:19; thử ngày khác thì chạy lệnh làm mới ngay trước khi thử); giờ nhận 14:00, ân hạn trả 12:30 (trả phòng sau đó có phụ thu: 30 % giá đêm cuối tới 15:00, 50 % tới 18:00), sau 18:00 là thêm đêm – thử buổi chiều thì làm KB7 theo bước 0 của hướng dẫn; "khách không đến" chỉ đánh dấu được sau giờ quy định buổi tối. Không nên thử từ 00:00 đến 06:00. |
| **Không gửi gì ra ngoài** | Không SMS, email, Zalo (văn bản báo giá chỉ để sao chép). Không gọi OTA, không TTLock (mã cửa lễ tân tạo tay trên app khóa, OTTIMO không lưu), không MISA. Bảng dữ liệu khai báo lưu trú chỉ để sao chép – **đừng dán lên cổng khai báo thật**. |
| **VietQR dùng tài khoản nhận anh/chị ghi trong `product/.env`** | OPS cài sẵn 3 dòng đó vào Tham số (không in ra đâu). Mã QR đúng chuẩn ngân hàng, nhưng app không tự biết tiền đã về: lễ tân bấm "Đã thấy tiền về", khoản đó chờ quản lý/chủ đầu tư đối soát với sao kê. Nếu đó là tài khoản thật, quét sẽ thấy đúng tên chủ tài khoản – chỉ quét để xem, **không chuyển tiền**. |
| **Đăng nhập, duyệt bằng mật khẩu** | PIN duyệt và xác thực 2 bước có ở Round 3. Sai mật khẩu 5 lần → khóa 15 phút; đăng nhập quá nhiều lần liên tục → "thử quá nhiều lần", chờ 15 phút. |
| **Tiếng Nga trên trang khách** | Có tiếng Nga, nhưng phần thông báo dữ liệu và câu đồng ý lưu ảnh đang hiện tiếng Anh tới khi người bản ngữ duyệt bản dịch (không dùng dịch máy cho câu pháp lý). Desk có tiếng Việt và tiếng Anh. |
| **Tốc độ** | Chạy trên máy cá nhân, không đại diện cho máy chủ thật. |
| **Dữ liệu dựng lùi ngày** | Các lượt ở "đã bắt đầu trước hôm nay" được dựng sẵn, nên màn **Giấy tờ & khai báo** có nhiều đơn mẫu "Thiếu người", "Đã quá hạn … giờ"; tab **Chờ đối soát** có sẵn 2 khoản mẫu; danh sách **Thiết bị được cấp** có sẵn một máy mẫu của đội ("Máy quầy lễ tân (demo)"). Đó là dữ liệu mẫu, không phải lỗi. |
| **App nhân viên 8182** | Hiện chỉ là khung trống (app điện thoại cho buồng phòng, bảo trì có ở Sprint 4). **Mọi vai** (kể cả Buồng phòng, Kỹ thuật, Sale, CTV) đăng nhập ở Desk **8181**. |
| **Tắt/bật lại giữa buổi** | Được – giấy tờ và ảnh đã nhập vẫn mở lại được sau khi khởi động lại (đã sửa 17/10, UXR đã thử). Chỉ `demo-down.sh` và `demo-reset.sh` xóa dữ liệu; `demo-reset.sh` đổi luôn mật khẩu và link khách. |

## B. Chưa làm – đừng tìm (đã có trong kế hoạch)
| Phần | Khi nào |
|---|---|
| Màn **Hôm nay** (danh sách đến/đi, "Cần chú ý"), **Tổng quan** chủ đầu tư (công suất, doanh thu đêm nay) | Sprint 4 – Round 2 |
| **App buồng phòng & bảo trì** trên điện thoại (việc hôm nay, dọn, kiểm phòng, báo sự cố, phiếu sửa). Vì vậy trạng thái buồng trên sơ đồ phòng chưa đổi theo việc dọn | Sprint 4 – Round 2 |
| **Khách gửi yêu cầu** qua trang khách, trang QR đặt trong phòng | Sprint 4 – Round 2 |
| **Ghi công nợ** khi trả phòng (quản lý/chủ đầu tư) | Sprint 4 – Round 2 |
| **Xin miễn phí (FOC)** cho phụ thu trả muộn, dòng phát sinh, minibar (hiện chỉ xin được cho phụ thu nhận sớm lúc nhận phòng) | Sprint 4 – Round 2 |
| Nút **"Điều chỉnh dòng"** trên bill và **"Đảo giao dịch thu"** cho quản lý/chủ đầu tư (nhật ký tiền vẫn xem được) | Sprint 4 – Round 2 |
| **Mã VietQR cho tiền cọc** ngay sau khi giữ chỗ (hiện VietQR chỉ có ở bước trả phòng) | Sprint 4 – Round 2 |
| **Xem lại bill** của đơn đã trả phòng, **ô ảnh biên nhận** khi CTV báo đã chuyển cọc | Sprint 4 – Round 2 |
| **Trả phòng sớm** | Sprint 4 nếu kịp, không thì Round 3 |
| Quét QR CCCD / đọc dòng mã hộ chiếu | Round 3 |
| **Web đặt phòng trực tiếp** cho khách | Round 3 |
| **Hợp đồng dài hạn đầy đủ** trong app (báo giá dài hạn, lịch thu theo kỳ, nhắc gia hạn), điện nước, báo cáo tháng. Round 2 chỉ có "đơn dài hạn nhập tay" để giữ phòng trên sơ đồ | Round 3 |
| Mã cửa trên trang khách, khách tự xem bill, xác minh khách bằng mã OTP | Round 3 |
| Đơn nhóm nhiều căn, đóng ca/bàn giao tiền | Round 3 |
| Kết nối thật: OTA / channel manager, VNPay / MoMo, khóa cửa TTLock, MISA / hóa đơn điện tử, cổng khai báo lưu trú, Zalo / email | Round 3 trở đi – cần tài khoản của anh/chị (ESC-009, ESC-010) |

## C. Lỗi đội đã biết khi giao bản demo
> ORC soạn 17/10 từ danh sách việc dời sang Sprint 4 (`s4-carryover.md`) và sổ lỗi QA; QC rà lại và sửa ở cổng Sprint 3 (17/10). UXR bổ sung 17/10 trưa sau khi tự bấm đủ 10 kịch bản; **17/10 chiều UXR đi lại trên bản dựng sau vòng sửa 9**: đã bỏ 9 lỗi đã sửa (nhập tay giấy tờ, gia hạn/thêm người trên đơn có sẵn, tải ảnh chứng từ khi chi hoàn, dòng "Đã thu", câu hộp Hủy đơn, lễ tân trưởng không thấy khoản hoàn, câu báo khi quản lý tự chi, phụ thu thêm người khi đang ở, ký hiệu `{room}`/`{n}` trong câu báo). Các dòng ghi **mới** là UXR thấy khi đi lại chiều 17/10 (đã báo đội, ORC sẽ báo lại lịch sửa). Anh/chị gặp các lỗi này thì **không cần ghi lại**. "KB" là số kịch bản trong hướng dẫn.

**Một chỗ phải làm đúng thứ tự (hướng dẫn đã ghi sẵn cách đi tiếp):**

| Gặp khi | Biểu hiện | Cách đi tiếp | Khi nào sửa |
|---|---|---|---|
| **mới** · KB7 – trả phòng **sau 12:30** mà chưa bấm **Trả muộn** | Bước Phụ phí để sẵn giờ trả 12:00 và ghi "Trả đúng giờ – không phụ thu"; bấm hoàn tất thì app đòi "ghi chú vì sao ghi bù" (ô ghi chú lại nằm ở bước Phụ phí). Sửa giờ thành giờ thật thì app nêu phụ thu, nhưng bước Bill không cộng khoản này vào số cần thu ("Đã thanh toán đủ", không có ô thu) và nút hoàn tất báo "Còn … đ chưa ghi nhận thanh toán…" – không đi tiếp được. Không có tiền nào bị ghi sai (app không lưu gì ở lần bấm đó) | Trong khung chi tiết đơn bấm **Trả muộn** trước: nhập giờ hiện tại, tick "đã báo khách", lưu; rồi mới **Trả phòng** (KB7 bước 0) | Đang xếp lịch |

**Lỗi khác:**

| Gặp khi | Biểu hiện | Khi nào sửa |
|---|---|---|
| **mới** · KB4 – nút **Xem đủ số / ảnh** | Nhập mật khẩu xong chỉ hiện đủ số giấy tờ, chưa mở được ảnh đã chụp hoặc khách gửi qua link (máy chủ có lưu ảnh; Desk chưa có chỗ xem). Lễ tân chưa đối chiếu được ảnh khách tự gửi | Đang xếp lịch |
| **mới** · KB4, KB7 – ô **Ghi chú giờ nhận / giờ trả (vì sao ghi bù)** | Sau khi app đòi ghi chú, sửa giờ lại cho đúng thì dòng đỏ "Giờ này sớm hơn lúc bấm khá lâu…" vẫn còn tới lần bấm sau | Đang xếp lịch |
| **mới** · KB6 – thêm người lớn vượt định mức khi khách đang ở | Có ô xác nhận và số phụ thu, nhưng chưa có lựa chọn **xin miễn** phụ thu người (app ghi "Vẫn ghi phụ thu rồi báo quản lý"). Ô tìm người đi cùng đang mang nhãn "Khách đứng tên" | Chưa xếp lịch |
| **mới** · KB7 – mở lại màn Trả phòng lần hai | Khung Folio bên phải hiện thêm cặp dòng minibar âm/dương (đảo rồi ghi lại); Phiếu thanh toán và số tiền vẫn đúng | Đang xếp lịch |
| **mới** · KB7 – hộp **Thêm phát sinh**, khoản Giặt ủi | Dòng hướng dẫn ghi "Phí phạt không tính vào doanh thu phòng" – giặt ủi không phải phí phạt | Đang xếp lịch |
| **mới** · KB8 – sau khi chi hoàn | Thông báo ghi "Đã ghi hoàn -500.000 đ." (thừa dấu trừ); danh sách ghi đúng "Đã ghi hoàn 500.000 đ" | Đang xếp lịch |
| **mới** · KB8 – chủ đầu tư bấm **Xem đủ số tài khoản** | Hộp nhập mật khẩu ghi "Xác nhận lại để xem giấy tờ" dù đang xem số tài khoản ngân hàng; dòng Ngân hàng nhận hiện mã BIN (970436) thay vì tên ngân hàng | Đang xếp lịch |
| **mới** · KB8, KB10 – **Nhật ký tiền › Nhật ký thao tác tiền** | Cột Lý do hiện mã kỹ thuật ("guest_changed_mind", "found_other", "minibar_recount") thay vì câu tiếng Việt | Đang xếp lịch |
| **mới** · KB1 – khung chi tiết đơn đang **giữ chỗ** (D5) | Folio ghi "Đã thu 0" (đúng) nhưng "Còn phải thu 0 đ" dù chưa cọc – số cần thu xem ở dòng "Cọc cần thu" | Đang xếp lịch |
| **mới** · KB8 – khung chi tiết đơn **đã hủy và đã hoàn** | Folio vẫn ghi "Đã thu −500.000", chưa có dòng "Đã hoàn" – xem số hoàn ở Nhật ký tiền › Hoàn tiền | Đang xếp lịch |
| KB4, KB6, KB7 – khung chi tiết đơn đang ở | Phần Folio có 2 dòng "Còn phải thu" (cùng số) | Sprint 4 |
| KB8 – nhập nơi nhận hoàn chuyển khoản | Ô **Ngân hàng nhận** chỉ nhận mã BIN 6 số của ngân hàng (ví dụ 970436), gõ tên ngân hàng sẽ bị xóa rồi báo "Bắt buộc"; chưa có danh sách chọn ngân hàng | Sprint 4 |
| KB2 – sau **Tạo nhanh khách** | Ô Khách đứng tên có thể vẫn hiện chữ đỏ "Bắt buộc" dù khách đã được chọn; bấm Tạo đơn vẫn được | Đang xếp lịch |
| KB2 – nút **Dùng căn …** khi đặt trùng | Bấm là tạo đơn ngay ở căn đó, giá tính lại theo căn mới; lễ tân chưa được xem lại giá trước khi tạo | Chờ UXD/PO xem lại |
| **Đơn đặt phòng** – ô Tìm kiếm | Chỉ tìm theo mã đơn, mã OTA, mã khách (chưa theo tên khách) | Sprint 4 |
| **Đơn đặt phòng** – cột "Còn phải thu" | Cột đang trống | Đang xếp lịch |
| Sau khi xác nhận cọc, đóng hộp link check-in… | Phím Esc không đóng khung chi tiết đơn – dùng nút X | Đang xếp lịch |
| KB3 – CTV gửi báo giá | Ngôn ngữ gửi khách mới có Tiếng Việt và English (chưa có tiếng Nga); lễ tân xác nhận cọc chưa thấy ghi chú CTV đã báo | Chờ PO xác nhận phạm vi |
| KB7 – nút **Giặt ủi** ở bước Phụ phí | Hộp "Thêm phát sinh" mở ra chưa chọn sẵn khoản – chọn lại "Giặt ủi (theo kg)" | Đang xếp lịch |
| KB3 – CTV bấm **Báo đã chuyển cọc** | Chưa có ô đính ảnh biên nhận: CTV chỉ báo số tiền. Bỏ qua phần "đính 1 ảnh" | Sprint 4 |
| KB3 – vừa giữ chỗ xong | Màn ghi "Mã QR … tạo ngay sau khi giữ chỗ" nhưng chưa có mã QR cọc, chỉ có số tiền và nội dung chuyển khoản. Mã VietQR đã có ở bước thu tiền khi trả phòng (KB7) | Sprint 4 |
| KB4 – nhận phòng sớm có phụ thu | Điều kiện "Đã thu đủ" chưa cộng phụ thu nhận sớm, nên app cho nhận phòng dù chưa thu khoản này. Khoản vẫn nằm trong phiếu thanh toán, và app đòi thu đủ lúc trả phòng | Sprint 4 |
| KB6 / hồ sơ khách – người đi cùng từng ở OTTIMO | App chưa tự nhận ra khách cũ qua số giấy tờ: lễ tân tìm hồ sơ cũ theo tên/SĐT, hoặc tạo hồ sơ mới. Hồ sơ khách chưa hiện 4 số cuối giấy tờ (màn nhận phòng và màn khai báo vẫn hiện) | Sprint 4 |
| KB7 – mở lại đơn đã trả phòng | Chưa có nút **Xem bill** để mở lại hoặc in lại phiếu đã chốt. Muốn in thì in ở bước 3, trước khi bấm Hoàn tất | Sprint 4 |
| Hủy đơn hoặc báo khách không đến, khi khách đã trả **thêm ngoài tiền cọc** (ví dụ phụ thu, dịch vụ) | Phần cọc được hoàn theo chính sách hủy thì app tự tạo yêu cầu hoàn (như ở KB8). Phần trả thêm thì chưa: lễ tân bấm **Yêu cầu hoàn …** trên chi tiết đơn | Sprint 4 |
| Dời căn cho đơn chưa đến (hoặc gán căn cho đơn OTA) sang căn có định mức người khác | Phụ thu thêm người không tự tính lại theo căn mới, nên có thể thu thừa hoặc thiếu. Xem lại phiếu thanh toán trước khi thu | Sprint 4 (ưu tiên) |
| Dời đơn chưa đến sang căn đắt hơn theo ý khách | Giá giữ như lúc đặt. Đây là chính sách đang chờ anh/chị quyết (ESC-019), không phải lỗi | Sau khi anh/chị quyết ESC-019 |
| Khách OTA đang ở đổi phòng từ lần thứ hai trở đi | Tiền chênh lệch có thể tính so với căn ngay trước, thay vì so với căn đặt ban đầu | Sprint 4 |
| Khách OTA đã gia hạn thêm đêm rồi xin đổi phòng, căn mới không trống đủ cả thời gian | App chặn và gợi ý căn khác; chưa có lựa chọn "chỉ chuyển tới hết đơn gốc" | Sprint 4 |
| Ảnh giấy tờ của khai báo chưa xác nhận tự xóa khi quá hạn | Màn khai báo chưa hiện dòng "Ảnh đã xóa lúc …". Ảnh vẫn đã bị xóa đúng hạn | Sprint 4 |
| Mở Desk (8181) và app nhân viên (8182) cùng lúc trong một trình duyệt | Đăng nhập bên này làm bên kia đổi người hoặc bị đăng xuất. Chỉ có ở bản demo trên máy; vai thứ hai dùng cửa sổ ẩn danh. (Ở bản demo này 8182 còn là khung trống nên chưa gặp) | Hết khi có máy chủ chạy thử (mỗi app một tên miền) |
| Bỏ một người khỏi đoàn khi khách đã gửi ảnh giấy tờ qua link check-in | Hệ thống có thể xóa nhầm ảnh của người **còn ở** và giữ ảnh của người đã bỏ (SEC-BE-53). Trong demo: chụp/gửi lại ảnh cho người còn ở | Sprint 4 – phải sửa trước khi dùng dữ liệu khách thật |
| *(Không gặp trong demo)* Miễn phí (FOC) trên tiền phòng hoặc phụ thu người, rồi đổi ngày, đổi căn, đổi số người, khôi phục đơn "không đến"; hủy đơn đã có dịch vụ chưa làm | Đội đã biết vài trường hợp hiếm: mất phần miễn phí, báo lỗi không lưu, hoặc dòng dịch vụ không tự bỏ. Desk hiện chỉ xin miễn được phụ thu nhận sớm và chỉ thêm dịch vụ khi khách đang ở, nên bản demo không đi tới các trường hợp này | Sprint 4 – sửa xong trước khi mở thêm nút xin miễn phí |
