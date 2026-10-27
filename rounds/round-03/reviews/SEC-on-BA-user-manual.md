# SEC review – Sổ tay sử dụng OTTIMO Desk v1.0 (nội dung 1.1)

- Người review: SEC | Round 3 – Review chéo | 27/10/2026
- Tài liệu: `product/docs/manual/user-manual-v1.0.md` (commit `52539f7`), kèm kiểm nhanh `product/docs/manual/ottimo-manual-v1.0.html`, `screenshot-list.md`, `img/` (chưa commit)
- Đối chiếu: `product/docs/security/security-requirements.md` (SR-LOCK-01/03/04, SR-DEV-07/08/09, SR-AUTH-05/06/08, SR-RET, SR-C3-09), `business-rules.md` (BR-403, BR-609/610/612, BR-961…964, BR-978), decision-log SEC 17/10 (mã cửa không qua Zalo và hội thoại OTA), `ESC-039.md`, `reviews/DOM-on-BA-user-manual.md` (thẻ 10), `reviews/PO-on-BA-user-manual.md`
- Bối cảnh làm nặng mức lỗi: repo `origin` là **công khai** (ESC-025). Mọi file trong repo, kể cả `04-investor-feedback/` do `/feedback` tạo, ai cũng đọc được. Sổ tay sẽ được in phát cho nhân viên.

## Tóm tắt

| Mức | Số thẻ |
|---|---|
| Blocker | 1 |
| Major | 11 |
| Minor | 5 |
| Suggestion | 1 |

Kết luận ngắn:
- Câu mới về mã cửa **đúng hướng** và chặt hơn BR-978: thêm Messenger, WhatsApp và gõ tay. Nhưng câu chưa đủ an toàn. Nó chỉ cấm kênh, chưa nói **ai** được nghe mã và **khi nào**. Câu từ chối "by phone" còn mời kẻ gian gọi đến xin mã (thẻ 02, 03).
- Lỗ hổng lớn nhất không nằm ở mã cửa. Sổ tay hướng dẫn chủ đầu tư gửi lỗi qua `/feedback` và gửi ảnh chụp màn hình, nhưng danh sách phải che **không có tên khách, SĐT, email**. Mà `/feedback` ghi thẳng vào repo công khai (thẻ 01).
- Ảnh `img/C2-14.png` để lộ **mã QR của link check-in còn hiệu lực**. Phải sửa trước khi commit thư mục ảnh (thẻ 11).
- Quy trình khôi phục chủ đầu tư (SEC 06.33) **không bị lộ**: mục 0.4 chỉ ghi "thủ tục riêng, không ghi trong sổ tay". Giữ nguyên.
- **Không tạo ESC mới.** Điều kiện SEC cho phương án A của ESC-039 nên được ghi thêm vào chính ESC-039 (thẻ 10).

---

## Thẻ feedback

### FB-R3-SEC-BA-01
- Mức độ: Blocker
- Vị trí: 0.8 điểm 9; 1.15 khung "Tạm ở v1.0" ("chủ đầu tư báo đội qua `/feedback`"); 4.3 "Sổ giấy 3 ngày đầu" ("gõ `/feedback` kèm mã đơn"); 5.5 dòng "Desk báo lỗi…" và đoạn cuối ("Chụp màn hình được thì che số giấy tờ, số tài khoản, mã QR, mã cửa")
- Vấn đề:
  - `/feedback` tạo file `04-investor-feedback/FB-INV-<số>.md` trong repo (`.claude/commands/feedback.md`). Repo `origin` là công khai.
  - Sổ tay chỉ bảo **che** số giấy tờ, số tài khoản, mã QR, mã cửa. Không nói che **tên khách, SĐT, email, ngày ở, số căn đi cùng tên**. Ảnh Desk nào cũng có các thông tin này (ví dụ Hôm nay, khung đơn, Giấy tờ & khai báo).
  - Mục 1.15 còn bảo chủ đầu tư tra **nhật ký truy cập giấy tờ** (ai xem giấy tờ của khách nào) qua `/feedback`. Khi đó nội dung khiếu nại của khách đi vào repo công khai. Kết quả tra cũng có thể bị ghi vào `rounds/`.
- Vì sao quan trọng: từ 02/11, mỗi lỗi chủ đầu tư báo có thể đăng dữ liệu cá nhân của khách thật lên internet. Đây là sự cố lộ dữ liệu theo NĐ 13/2023 (phải thông báo trong 72 giờ). Lỗi do chính quy trình trong tài liệu đào tạo tạo ra, nên mọi người sẽ làm theo.
- Đề xuất sửa:
  - (a) Thay 0.8 điểm 9 bằng:
    > 9. Báo lỗi hoặc gửi ảnh cho đội: **chỉ ghi mã đơn, căn, giờ và mã tham chiếu Desk báo**. **Không** ghi tên, số điện thoại, email, số giấy tờ của khách. Ảnh chụp màn hình phải **che kín** (tô đặc, không làm mờ): tên khách, số điện thoại, email, số giấy tờ, ảnh giấy tờ, số tài khoản, mã QR, mã cửa. Mọi thứ gõ qua `/feedback` đều được lưu vào kho mã của dự án, nên coi như có thể bị người ngoài đọc.
  - (b) Đoạn cuối 5.5 viết lại cho cùng ý (trỏ về 0.8 điểm 9). Bảng 5.5 dòng "Desk báo lỗi…" thêm: "chỉ ghi mã đơn, không ghi tên khách".
  - (c) Bỏ đường "/feedback" ở 1.15. Thay bằng:
    > Cần tra ai đã xem giấy tờ của một khách (ví dụ khách khiếu nại): chủ đầu tư nhắn Điều phối viên **chỉ mã đơn** và chữ "tra nhật ký giấy tờ". Kết quả gửi riêng cho chủ đầu tư, không lưu trong kho mã. Không gõ tên khách hay nội dung khiếu nại vào `/feedback`.
  - (d) Gửi ORC (ngoài phạm vi sổ tay): cập nhật `hotel-orchestrator` mục D để khi ghi `FB-INV-*.md`, ORC xóa tên, SĐT, email, số giấy tờ khỏi lời chủ đầu tư, chỉ giữ mã đơn. Ảnh chủ đầu tư gửi không lưu vào repo. SEC sẽ ghi việc này vào decision-log ở bước Phản hồi.

### FB-R3-SEC-BA-02
- Mức độ: Major
- Vị trí: 2.10 khung "Mã cửa" đoạn 2; 2.21 dòng "Khách nhờ gửi mã cửa qua Zalo"; 5.4 "Khách hỏi xin gửi mã cửa qua Zalo?"; 5.5 câu in đậm cuối bảng
- Vấn đề: câu "gọi điện cho đúng số của khách đứng tên rồi đọc mã" chỉ chặn **cuộc gọi đến**. Còn bốn kẽ hở:
  - (1) **Điều kiện trước khi đọc mã.** 2.21 viết "rồi gọi đúng số khách đứng tên để đọc mã" như việc làm ngay. BR-402/BR-613 và SR-GST-15 đòi trước khi giao mã phải có: đơn đã nhận phòng, giấy tờ người đứng tên đã đối chiếu, đã thu đủ (đơn Trực tiếp). Câu "không giao mã khi chưa có giấy tờ" chỉ nằm trong khung thu tiền 2.13.
  - (2) **"Số của khách đứng tên" là số nào.** Kẻ gian nhắn Zalo: "tôi đổi số, gọi số này". Lễ tân sửa SĐT trên đơn rồi gọi số mới. Thế là "đúng số trên đơn".
  - (3) **Ai nghe máy.** Có thể là người nhà, hộp thư thoại, hoặc người cầm máy hộ.
  - (4) **Không xác nhận lại** điều chỉ khách biết trước khi đọc.
- Vì sao quan trọng: mã cửa mở căn đang có người ngủ và đồ đạc của khách. Kịch bản thường gặp: người ngoài (bạn cũ, người đặt hộ đã cãi nhau, kẻ trộm biết tên khách) xin mã qua chat rồi xin "gọi số này". Nếu lộ thì vừa mất an toàn của khách, vừa thành sự cố NĐ 13. Đây cũng là điều kiện C-10 của SEC (quyết định 17/10).
- Đề xuất sửa: thay đoạn 2 khung "Mã cửa" ở 2.10 bằng:
  > Mã cửa **không gửi bằng chữ hay ảnh** qua bất kỳ kênh nào (mục 0.8 điểm 10). Chỉ giao mã khi đơn đủ điều kiện nhận phòng: **đã nhận phòng trên Desk**, có giấy tờ người đứng tên, đã thu đủ (đơn Trực tiếp) – mục 2.13. Hai cách giao:
  > - **Tại quầy**: đọc nhỏ hoặc cho khách xem màn app khóa. Không đọc to khi có người khác đứng gần.
  > - **Gọi điện**: lễ tân **tự gọi ra** số điện thoại **đã có trên đơn từ trước hôm nay** (hoặc số kênh OTA cung cấp). Chỉ đọc khi người nghe xác nhận đúng **họ tên người đứng tên và ngày đến**. Không để lại lời nhắn thoại. Không đọc cho người nghe hộ.
  > - **Không** đọc mã trong cuộc gọi khách gọi đến, kể cả khi người gọi nói đúng tên và mã đơn: cúp máy, gọi lại số trên đơn.
  > - Khách xin đổi số điện thoại trong ngày đến: **không** gọi số mới để đọc mã. Mời khách ra quầy, đối chiếu giấy tờ rồi mới sửa số.
  > - Nghi ngờ (người khác xin mã thay khách, khách đòi gấp, số lạ): không giao, báo quản lý.

  Dòng 2.21 thay cột "Làm gì" bằng: "**Không gửi.** Trả lời bằng câu ở mục 5.4. Đơn đủ điều kiện (mục 2.10) thì **tự gọi** số trên đơn để đọc mã. Chưa đủ thì mời khách ra quầy." 5.4 và 5.5 trỏ về 2.10.

### FB-R3-SEC-BA-03
- Mức độ: Major
- Vị trí: 2.21 câu từ chối EN/VI
- Vấn đề:
  - "We share door codes by phone or at the desk only" là lời mời "vậy tôi gọi cho anh nhé". Khách (hoặc kẻ gian) sẽ gọi đến, đúng kiểu cuộc gọi mà 2.10 đã cấm đọc mã.
  - Bản VI "qua điện thoại" cũng vậy.
  - Câu chưa nói **lễ tân sẽ gọi số nào**. Nó cũng chưa theo giọng thương hiệu: EN dẫn, VI hỗ trợ, ngắn, điềm tĩnh, nói "OTTIMO" thay vì "we" lẫn lộn.
- Vì sao quan trọng: câu chuẩn được dán nhiều lần mỗi tuần. Câu sai thì đào tạo xong vẫn sai.
- Đề xuất sửa (thay nguyên ô):
  > "For your security, OTTIMO never sends door codes by message. We will call you on the phone number in your booking, or you may collect your code at the front desk." / "Vì an toàn của anh/chị, OTTIMO không gửi mã cửa qua tin nhắn. Lễ tân sẽ gọi vào số điện thoại trong đơn đặt phòng, hoặc anh/chị nhận mã tại quầy."

  UXD rà chữ theo brand guideline. Nghĩa giữ ba ý: không qua tin nhắn · OTTIMO gọi ra số trong đơn · hoặc tại quầy.

### FB-R3-SEC-BA-04
- Mức độ: Major
- Vị trí: 2.10 khung "Mã cửa" đoạn 2 (danh sách kênh); 0.8 điểm 6; 3.12; 4.1 "Luôn nhớ"; 2.7 khung dài hạn; 1.14 sổ giao ca
- Vấn đề:
  - (1) Danh sách kênh cấm còn thiếu **SMS, email, Viber, Telegram, iMessage** và **ảnh chụp màn app khóa**. BR-978 chỉ cho hai đường ở MVP: lễ tân đọc trực tiếp hoặc gọi điện. Liệt kê kiểu "Zalo, Messenger…" làm người đọc hiểu kênh khác thì được.
  - (2) Không cấm **ghi** mã cửa vào sổ giao ca, ghi chú đơn, giấy dán quầy, nhóm chat nội bộ. 0.8 điểm 6 chỉ cấm giấy tờ, thẻ, sức khỏe.
  - (3) Buồng phòng, bảo trì không có câu "không mở cửa căn cho người tự nhận là khách". Đây là cách vào phòng phổ biến nhất ở khách sạn nhỏ: "tôi quên mã, mở giúp".
- Vì sao quan trọng: mã cửa nằm trong chữ ở bất kỳ đâu là đã lộ. Sổ giao ca nằm ở quầy và được chụp lại khi đối chiếu ngày 22:00.
- Đề xuất sửa:
  - Thay danh sách kênh ở 2.10 bằng: "**không gửi bằng chữ hay ảnh qua bất kỳ kênh nào** (Zalo, Messenger, WhatsApp, SMS, email, hộp thư OTA…), kể cả gõ tay".
  - Thêm 0.8 **điểm 10**:
    > 10. **Mã cửa** chỉ nằm trên app khóa. Không ghi vào ghi chú đơn, sổ giao ca, sổ giấy, giấy dán quầy, nhóm chat nội bộ; không gửi cho đồng nghiệp bằng tin nhắn. Cần giao ca thì nói trực tiếp hoặc xem lại trên app khóa.
  - 3.12 thêm: "**Không mở cửa căn** cho người nói mình là khách, kể cả khi họ biết tên khách. Mời ra quầy hoặc gọi lễ tân." 4.1 "Luôn nhớ" thêm câu tương tự.

### FB-R3-SEC-BA-05
- Mức độ: Major
- Vị trí: 2.10 khung "Mã cửa" đoạn 1; 2.12 Gia hạn bước 4; 2.15 bước 3; 0.4 bảng mất điện thoại; 5.6 dòng mã cửa
- Vấn đề: sổ tay bảo "tạo mã trên app khóa như hiện nay" nhưng không nói:
  - (1) **App khóa cài trên máy nào, đăng nhập tài khoản nào.** Tài khoản quản trị TTLock mở được cả 10 căn. Nếu nằm trên điện thoại cá nhân của lễ tân thì mất máy hoặc nghỉ việc là mất kiểm soát mọi cửa. SR-DEV-08/09 cấm dữ liệu C3 trên máy cá nhân.
  - (2) **Cách đặt mã** theo BR-403/SR-LOCK-01/04: mã ngẫu nhiên mới mỗi lượt ở, **đặt hạn trên chính khóa** tới giờ trả, không dùng lại mã cũ, không đặt theo ngày sinh/SĐT/số căn. Bình luận nguồn cố ý không ghi số chữ số vì chữ trên màn còn sai. Nhưng nguyên tắc thì phải ghi.
  - (3) Bảng 0.4 "mất điện thoại" chỉ nhắc app nhân viên, không nhắc app khóa.
- Vì sao quan trọng: ở v1.0, mã cửa nằm hoàn toàn ngoài Desk. Không có nhật ký `c3_access_log`, không có step-up. Câu chữ trong sổ tay là lớp bảo vệ duy nhất.
- Đề xuất sửa: thêm vào khung "Mã cửa" ở 2.10, trước đoạn về kênh:
  > - App khóa chỉ cài trên **điện thoại hoặc máy tính bảng của cơ sở**, không cài trên điện thoại cá nhân. Tài khoản quản trị app khóa do chủ đầu tư giữ. Lễ tân dùng tài khoản được ủy quyền riêng nếu app khóa cho phép.
  > - Mỗi lượt ở **một mã ngẫu nhiên mới** (app khóa tạo). Không dùng ngày sinh, số điện thoại, số căn, mã cũ. Luôn đặt **hạn trên khóa** tới giờ trả phòng (trả muộn đã hẹn thì tới giờ đó).
  > - Trả phòng, đổi phòng, khách rời sớm, hủy, không đến: **xóa mã ngay** (Desk nhắc bằng việc "Xóa mã trên app khóa").

  Bảng 0.4 thêm dòng: "Mất điện thoại/máy tính bảng có app khóa → **báo chủ đầu tư ngay** để đổi mật khẩu tài khoản app khóa và thu hồi quyền của máy đó." ORC/INV xác nhận hiện app khóa đang cài ở máy nào. Nếu đang trên máy cá nhân, chuyển trước 02/11.

### FB-R3-SEC-BA-06
- Mức độ: Major
- Vị trí: 0.9 khung "Tạm ở v1.0 (tới v1.1)" (DOM thẻ 10); 5.1 dòng 22:00; 5.5 dòng "Mất mạng tại quầy"; 4.3 "Sổ giấy 3 ngày đầu"
- Vấn đề: SEC đánh giá danh sách chép tay theo yêu cầu DOM thẻ 10. Danh sách có **tên + căn + giờ đến + SĐT + tiền**, đúng phạm vi BR-961 (bảng dự phòng). Nhưng sổ tay còn thiếu năm điểm:
  - (1) **Tối thiểu hóa chưa đúng.** Khách **đi** đang ở trong căn, không cần SĐT trên giấy. Danh sách cũng nên có **mã đơn** để nhập bù chính xác.
  - (2) **"Ngăn khóa tại quầy"** không nói ai giữ chìa. Không cấm chụp ảnh danh sách, mang ra khỏi cơ sở, hay để trên mặt quầy nơi khách đứng.
  - (3) **"Xé hủy"** một lần thì ghép lại đọc được. Bỏ vào thùng rác sảnh là rò rỉ.
  - (4) **Khi mất mạng**, câu "giao căn cho khách có tên trong danh sách" chưa buộc **xem giấy tờ gốc** trước khi giao mã. Nó cũng không cấm chụp giấy tờ bằng điện thoại để "nhập bù sau". Lúc mất mạng là lúc dễ làm vậy nhất.
  - (5) **Sổ giấy 3 ngày đầu** (đơn, tiền thu, có thể có tên/SĐT) không có quy định cất giữ và hủy sau 05/11.
  - Thêm: "mở Desk trên điện thoại cơ sở" không phải máy được cấp quyền. Trên đó không làm được giấy tờ hay nhận phòng, và tuyệt đối không dùng điện thoại cá nhân thay.
- Vì sao quan trọng: một tờ giấy ghi "chị Lan, căn 302, đến 21:00, SĐT…" rơi ra ngoài là thông tin để theo dõi hoặc giả danh khách (xin mã cửa, thẻ 02). NĐ 13/2023 áp cho cả dữ liệu trên giấy. Bên xử lý phải có biện pháp bảo vệ và xóa khi hết mục đích.
- Đề xuất sửa: thay khung 0.9 bằng:
  > **Tạm ở v1.0 (tới v1.1):** chưa có bảng dự phòng in sẵn mỗi sáng.
  > - 22:00 mỗi tối, lễ tân ca tối chép tay **danh sách khách đến và khách đi ngày mai** từ **Sơ đồ phòng / Đơn đặt phòng**:
  >   - Khách đến: **mã đơn**, tên gọi, căn, giờ đến dự kiến, còn phải thu, số điện thoại.
  >   - Khách đi: **mã đơn**, căn, giờ trả đã hẹn, còn phải thu. Không cần số điện thoại.
  >   - **Không** ghi số giấy tờ, mã cửa, email, số tài khoản.
  > - Danh sách luôn nằm **trong ngăn khóa**, chìa do người đang trực giữ. Không để trên mặt quầy, không chụp ảnh, không mang ra khỏi cơ sở, không gửi qua tin nhắn.
  > - Chỉ giữ **một bản**. Chép bản mới xong thì hủy bản cũ ngay: **cắt nhỏ** (máy hủy giấy, hoặc xé ngang dọc nhiều lần), bỏ vào thùng rác khu nhân viên, không bỏ thùng rác sảnh.
  > - Mất mạng: dùng danh sách để giao căn đã sạch cho khách có tên trong danh sách **sau khi xem giấy tờ gốc** của người đứng tên, thu tiền, ghi sổ giấy, nhập bù trong 24 giờ. **Không chụp giấy tờ khách bằng điện thoại** để nhập sau. Có mạng lại thì nhập giấy tờ trên máy quầy (khách đưa lại giấy tờ, hoặc gửi qua link check-in online), và giữ đúng hạn khai báo (mục 2.11).
  > - Desk trên **điện thoại của cơ sở** chỉ để xem đơn và thu tiền. Không dùng điện thoại cá nhân. Xong thì đăng xuất.
  > - **Sổ giấy** (ba ngày đầu, và mọi lần mất mạng) không ghi số giấy tờ, số thẻ, mã cửa. Hết dùng thì nộp chủ đầu tư cất két cùng chứng từ kế toán.

  Đoạn 5.1 dòng 22:00 và 5.5 giữ, trỏ về 0.9. SEC chấp nhận có **SĐT khách đến** trên giấy, theo BR-961 và mục đích liên lạc khi mất mạng, khi có các điều kiện trên. DOM thẻ 10 đóng phần SEC.

### FB-R3-SEC-BA-07
- Mức độ: Major
- Vị trí: 0.3 "Bật lần đầu" bước 5; 0.2 "Luôn nhớ"; 0.4 bảng dòng "Chủ đầu tư hoặc quản lý mất điện thoại, còn mã khôi phục"; 1.8 và 2.21 (quản lý đăng nhập trên máy quầy); 5.5 dòng "Nghi lộ mật khẩu" ("Đăng xuất mọi máy")
- Vấn đề:
  - (1) Bước 5 cho **Tải về (.txt)** hoặc **In** 10 mã khôi phục, nhưng không nói làm trên máy nào. Nếu quản lý bật 2 bước trên **máy quầy dùng chung**, tệp .txt nằm trong thư mục Tải về, bản in nằm trên khay máy in. Lễ tân có mã khôi phục là vượt được 2 bước.
  - (2) Sổ tay hướng dẫn quản lý **đăng nhập trên máy quầy** để duyệt (1.8, 2.21), nhưng không nói **không cho trình duyệt lưu mật khẩu**. SR-DEV-07 có quy định này, nhưng nhân viên không đọc checklist. Tài khoản lễ tân không có 2 bước. Chỉ cần lưu mật khẩu trên máy quầy là người khác vào thay được, phá "mỗi người một tài khoản" (SR-AUTH-08) và làm sai nhật ký.
  - (3) Quản lý mất điện thoại nhưng còn mã khôi phục thì sổ tay chỉ bảo tự đăng ký lại, **không báo chủ đầu tư**. Phiên Desk đang mở và mật khẩu lưu trên máy bị mất vẫn còn.
  - (4) 5.5 ghi "Đăng xuất mọi máy" nhưng sổ tay không chỉ chỗ bấm. Nếu Desk không có nút này thì câu sai. Desk có cơ chế: **Đặt lại mật khẩu** thì đăng xuất mọi máy (SR-AUTH-05, mục 1.5).
- Vì sao quan trọng: 2 bước là lớp chặn duy nhất cho thao tác đổi tài khoản nhận tiền, thêm người dùng, cấp máy. Mã khôi phục lộ trên máy quầy là mất lớp này.
- Đề xuất sửa:
  - 0.3 bước 5 thay bằng:
    > 5. Desk hiện **10 mã khôi phục** một lần duy nhất. **Làm bước này trên máy hoặc điện thoại riêng của anh/chị, không làm trên máy quầy.** Bấm **In** (lấy giấy ngay khỏi máy in) hoặc **Tải về (.txt)** rồi chép vào trình quản lý mật khẩu, **xóa tệp và dọn thùng rác**. Cất 2 nơi tách khỏi điện thoại. Không chụp ảnh, không gửi qua chat.
  - 0.2 "Luôn nhớ" thêm: "Trình duyệt hỏi **Lưu mật khẩu?** thì luôn chọn **Không bao giờ**, nhất là trên máy quầy."
  - 0.4 dòng quản lý mất điện thoại thêm cuối: "…làm lại như mục 0.3, rồi **báo chủ đầu tư** để **Đặt lại mật khẩu** cho anh/chị (Desk đăng xuất anh/chị trên mọi máy, kể cả máy bị mất)."
  - 5.5 cột "Trong lúc chờ" dòng "Nghi lộ mật khẩu" đổi thành: "Chủ đầu tư **Đặt lại mật khẩu** người đó (Desk đăng xuất trên mọi máy) hoặc **Khóa tài khoản**." QA kiểm xem Desk có nút "Đăng xuất mọi máy" không. Nếu có, giữ câu cũ và chỉ chỗ bấm.

### FB-R3-SEC-BA-08
- Mức độ: Major
- Vị trí: 5.8 "Tập ở đâu"; 0.2 "Luôn nhớ"; 0.4 câu "Không ai trong đội kỹ thuật hỏi mật khẩu…"
- Vấn đề:
  - (1) Sổ tay không bảo **mật khẩu Desk tập phải khác mật khẩu Desk thật**. Nhân viên đặt một mật khẩu cho cả hai là chuyện thường gặp. Desk tập (staging) có độ bảo vệ thấp hơn, và tài khoản tập do đội tạo.
  - (2) Không nói tài khoản tập bị **khóa sau đợt đào tạo**.
  - (3) Không có câu chống lừa đảo đăng nhập: chỉ gõ đúng địa chỉ, không bấm link đăng nhập gửi qua Zalo/email. Bình luận nguồn đã đúng khi không in địa chỉ Desk tập. Nhưng chính vì có hai địa chỉ, nhân viên dễ tin một link giả "trang tập".
  - (4) Câu "không ai trong đội kỹ thuật hỏi mật khẩu" quá hẹp. Kẻ gian thường giả **chủ đầu tư, quản lý, ngân hàng, OTA**.
- Vì sao quan trọng: lộ mật khẩu lễ tân là vào được Desk thật trên máy quầy đã cấp. Tài khoản lễ tân không có 2 bước (SR-AUTH-06 chỉ bắt buộc OWN/MGR).
- Đề xuất sửa:
  - 5.8 thêm sau gạch đầu tiên:
    > - Mật khẩu Desk tập **khác** mật khẩu Desk thật. Không dùng lại mật khẩu Desk thật ở bất kỳ trang nào khác.
    > - Tài khoản tập bị khóa sau buổi đào tạo cuối. Cần tập thêm thì nhờ chủ đầu tư.
  - 0.2 "Luôn nhớ" thêm:
    > - Chỉ đăng nhập ở `desk.ottimo.vn` bằng cách **gõ địa chỉ hoặc dùng dấu trang**. Không bấm link đăng nhập gửi qua Zalo, email, tin nhắn.
  - 0.4 câu cuối thay bằng: "**Không ai** – chủ đầu tư, quản lý, đội kỹ thuật, ngân hàng hay OTA – hỏi mật khẩu, mã 6 số hay mã khôi phục của anh/chị. Ai hỏi thì không đưa và báo chủ đầu tư."
  - Gửi OPS/QA (ngoài phạm vi sổ tay): tài khoản tập tạo theo người, mật khẩu tạm buộc đổi, đặt ngày khóa. Staging không chứa dữ liệu khách thật.

### FB-R3-SEC-BA-09
- Mức độ: Major
- Vị trí: 2.4 Báo giá bước 4 ("Sao chép gửi Zalo, dán vào tin nhắn riêng với khách") và Giữ chỗ bước 4 (gửi mã QR); 2.9 bước 3; 2.14 "Bill" khung Tạm; 5.4 "Khách muốn bill gửi qua Zalo?"
- Vấn đề:
  - (1) **Gửi từ máy nào.** SR-DEV-07 cấm cài Zalo/ứng dụng chat trên **máy quầy đã cấp quyền**. Lý do: máy này có bộ nhớ tạm chứa dữ liệu khai báo (2.11) và ảnh giấy tờ. Sổ tay lại bảo lễ tân "sao chép gửi Zalo" ngay trên máy quầy. Nhân viên sẽ cài Zalo PC hoặc mở Zalo Web trên máy đó, rồi một lần dán nhầm là gửi dữ liệu khai báo cho khách.
  - (2) **Gửi từ tài khoản nào.** BR-978 (SEC DOM-06) buộc tin có **số tiền hoặc VietQR** kèm câu chống giả danh: "OTTIMO chỉ nhắn từ Zalo OA đã xác thực và hộp thư OTA, không bao giờ đổi số tài khoản qua tin nhắn, không hỏi số thẻ". Nếu lễ tân gửi QR từ **Zalo cá nhân** thì câu này mất nghĩa, và khách không phân biệt được tin thật với kẻ giả danh OTTIMO.
  - (3) Không cấm gửi **ảnh QR hay số tài khoản** không do Desk tạo (ví dụ ảnh QR cũ lưu trong máy).
- Vì sao quan trọng: lừa đảo giả danh khách sạn để nhận cọc rất phổ biến. Kẻ gian lấy tên, ảnh, giọng văn của OTTIMO rồi gửi QR khác. Khách mất tiền và OTTIMO mất uy tín. Kênh gửi không rõ cũng phá kiểm soát của SR-DEV-07.
- Đề xuất sửa: thêm vào đầu 2.4 (và trỏ từ 2.9, 2.14, 5.4):
  > **Nhắn khách từ đâu:** chỉ từ **tài khoản Zalo/số điện thoại của OTTIMO trên điện thoại của cơ sở** (hoặc hộp thư OTA). Không nhắn khách từ Zalo cá nhân. **Máy quầy đã cấp quyền không cài và không mở Zalo/Zalo Web.** Mở Desk trên điện thoại cơ sở để **Sao chép gửi Zalo**.
  > Tin có số tiền hoặc mã VietQR: chỉ gửi mã **Desk vừa tạo cho đúng đơn**, kèm câu: "OTTIMO only messages you from this account and your OTA inbox, and never changes bank details by message." / "OTTIMO chỉ nhắn từ tài khoản này và hộp thư OTA, không bao giờ đổi số tài khoản qua tin nhắn." (UXD hoàn thiện chữ). Không gửi ảnh QR cũ, không gõ số tài khoản bằng tay.

  ORC/INV xác nhận v1.0 có tài khoản Zalo của cơ sở (OA hoặc số cơ sở) trên điện thoại cơ sở chưa. Nếu chưa có, dùng tạm số điện thoại cơ sở. Việc này ghi `[GIẢ ĐỊNH – chờ INV xác nhận]`, không cần ESC.

### FB-R3-SEC-BA-10
- Mức độ: Major
- Vị trí: 2.13 khung "Tạm ở v1.0 – kiểm tiền chuyển khoản đã về"; 5.4 "Khách chuyển khoản nhưng tôi không xem được tài khoản ngân hàng?"; bình luận "Chờ ESC-039"
- Vấn đề:
  - (1) Ban ngày lễ tân "nhắn hoặc gọi chủ đầu tư/quản lý, chờ xác nhận đã thấy tiền". Sổ tay không nói **xác nhận phải đến từ đâu, gồm gì**. Kẻ gian tạo Zalo mang ảnh và tên chủ đầu tư rồi nhắn "OK tiền về rồi". Chữ "OK" không gắn số tiền hay mã đơn cũng dễ nhầm giữa hai khách cùng chuyển.
  - (2) Câu "ảnh chụp màn hình không phải bằng chứng" đúng, nhưng thiếu một dạng giả thường gặp: **SMS biến động số dư giả** (giả brandname ngân hàng) do khách đưa ra xem.
  - (3) Về ESC-039 phương án A (đội đề xuất), SEC thấy rủi ro mà ESC chưa nêu:
    - Thông báo biến động số dư thường hiện **số dư và mọi giao dịch** của tài khoản. Theo ESC-039, đây đang là **tài khoản cá nhân của chủ đầu tư**. Lễ tân sẽ thấy tài chính cá nhân của chủ đầu tư.
    - Nếu làm A bằng cách **đăng nhập app ngân hàng** trên điện thoại cơ sở thì lễ tân có quyền chuyển tiền đi.
    - Thông báo qua **SMS** giả được, như điểm (2).
- Vì sao quan trọng: đây là đường mất tiền trực tiếp, đúng rủi ro ESC-039 nêu. Kiểm soát "thấy tiền mới bấm" chỉ có giá trị khi người báo "thấy tiền" là thật và báo đúng khoản.
- Đề xuất sửa:
  - 2.13 khung Tạm, gạch 07:00–22:00, thay bằng:
    > - **07:00–22:00**: gọi hoặc nhắn chủ đầu tư/quản lý **qua số đã lưu sẵn trong danh bạ điện thoại cơ sở**, kèm **mã đơn và số tiền**. Chỉ bấm khi người đó trả lời **đúng mã đơn và số tiền**. Tin xác nhận đến từ số hoặc tài khoản lạ (kể cả có ảnh, tên chủ đầu tư) thì không tin, gọi lại số đã lưu.
  - Gạch "Ảnh chụp màn hình…" thêm: "…và **tin nhắn SMS báo tiền khách đưa xem** không thay cho xác nhận."
  - Gửi ORC/DOM, bổ sung vào **ESC-039** (không tạo ESC mới) dòng "Điều kiện của SEC cho A":
    > (1) Dùng **loa báo tiền** hoặc tính năng ngân hàng chỉ báo **tiền vào** (số tiền + nội dung), **không hiện số dư**. (2) Thiết bị ở quầy **không đăng nhập ứng dụng ngân hàng có quyền chuyển tiền**. (3) Không dùng SMS biến động số dư làm nguồn xác nhận. (4) Nếu là điện thoại cơ sở thì theo SR-DEV-08: khóa màn hình, không cài app chat cá nhân. (5) Nên làm cùng lúc chuyển sang tài khoản doanh nghiệp.
  - Khi INV quyết A, BA sửa khung theo bình luận đã có, giữ (2) và (3).

### FB-R3-SEC-BA-11
- Mức độ: Major
- Vị trí: `product/docs/manual/img/C2-14.png` (ảnh mục 2.9, chưa commit); `screenshot-list.md` quy tắc 3
- Vấn đề:
  - Ảnh che dòng link nhưng **để nguyên mã QR của link check-in**. QR mang đúng link token, hạn tới 30/10/2026 12:00, của đơn OTM-00359 trên staging. Ai quét ảnh trong repo công khai cũng mở được trang khách và gửi giấy tờ vào đơn đó.
  - Ảnh vi phạm quy tắc 3 của chính danh sách ảnh ("Luôn che mã QR").
  - SEC đã xem C1-08, C1-11, C1-12, C2-04, C2-21: các ảnh này che đúng. 35 ảnh còn lại chưa xem.
- Vì sao quan trọng: dữ liệu staging là giả nên tác hại trực tiếp thấp. Nhưng ảnh dạy sai mẫu cho người chụp ảnh thật sau này. Đây cũng là token còn sống trong repo công khai, và lịch sử git không xóa được nếu đã commit.
- Đề xuất sửa (trước khi commit `img/`):
  - (1) UXD/QA tô đặc ô QR trong C2-14.png.
  - (2) QA bấm **Thu hồi link** của đơn OTM-00359 trên staging.
  - (3) QA rà lại cả 41 ảnh theo quy tắc 3–4 (QR, link có token, tên Wi-Fi). Ghi kết quả vào báo cáo QA.
  - (4) Kiểm `ottimo-manual-v1.0.html` không nhúng bản ảnh chưa che (ảnh base64).
  - SEC kiểm lại trước commit.

### FB-R3-SEC-BA-12
- Mức độ: Major
- Vị trí: 1.7 bước 7 và gạch "Trong 24 giờ sau khi đổi…"; 5.4 "Tại sao đổi tài khoản nhận tiền không có hiệu lực ngay?"
- Vấn đề:
  - Hiệu lực từ ngày kế tiếp và thông báo cho chủ đầu tư, quản lý (kể cả email) là **kiểm soát phát hiện** tráo tài khoản. Sổ tay không nói **nhận thông báo mà mình không đổi thì làm gì**.
  - Quản lý nhận thông báo nhưng không có quyền **Hủy lịch** (chỉ chủ đầu tư).
  - Email "từ `info@ottimo.vn`" cũng có thể bị giả để dẫn tới trang đăng nhập giả.
- Vì sao quan trọng: kẻ chiếm được tài khoản chủ đầu tư sẽ đổi tài khoản nhận. Một ngày chờ chỉ có ích nếu có người phản ứng trong ngày đó. Nếu không, từ hôm sau mọi VietQR chuyển tiền vào tài khoản của kẻ gian.
- Đề xuất sửa: thêm sau bước 7 của 1.7:
  > **Nhận thông báo đổi tài khoản nhận mà anh/chị không làm:**
  > - Chủ đầu tư: mở Desk bằng cách **gõ địa chỉ** (không bấm link trong email), **Hủy lịch** ngay, **đổi mật khẩu**, **tạo bộ mã khôi phục mới**, báo đội.
  > - Quản lý: **gọi chủ đầu tư ngay**. Đến khi chủ đầu tư xác nhận, lễ tân **ngừng gửi mã VietQR**, mời khách trả tiền mặt hoặc thẻ.

### FB-R3-SEC-BA-13
- Mức độ: Major
- Vị trí: 2.13 dòng "Thẻ (máy POS tại quầy)"; 2.6 bước 3 gạch "Kênh trả bằng thẻ thanh toán ảo"; 0.8 điểm 6
- Vấn đề: sổ tay chỉ có "không nhập số thẻ" vào Desk. Còn thiếu:
  - (1) **Không nhận số thẻ qua điện thoại, tin nhắn, email** để "quẹt hộ". Khách đặt Zalo hay đọc số thẻ "cho nhanh".
  - (2) **Không chụp thẻ**, không ghi số thẻ ra giấy. Thẻ ở trong tầm mắt khách khi quẹt.
  - (3) Thẻ ảo OTA (VCC): xem ở đâu, nhập ở đâu, ai được làm, không sao chép/in/chụp.
- Vì sao quan trọng: nguyên tắc dự án là dữ liệu thẻ không qua hệ thống OTTIMO (PCI DSS, SR-PAY). Nhưng nếu nhân viên chép số thẻ vào giấy hoặc Zalo thì vẫn lộ dữ liệu thẻ, chỉ khác là lộ ngoài Desk. Ngân hàng có thể đòi lại tiền (chargeback) và phạt merchant POS.
- Đề xuất sửa:
  - Bảng 2.13 dòng **Thẻ** cột Ghi chú: "**Không nhập số thẻ.** Khách quẹt/chạm thẻ trên máy POS trước mặt mình."
  - Dưới bảng thêm:
    > - **Không nhận số thẻ** qua điện thoại, Zalo, email hay giấy. Không chụp thẻ, không ghi số thẻ. Khách muốn trả thẻ thì trả tại máy POS ở quầy.
    > - **Thẻ ảo của OTA**: chỉ chủ đầu tư/quản lý xem trên extranet và gõ thẳng vào máy POS. Không sao chép, không in, không chụp màn hình số thẻ.

### FB-R3-SEC-BA-14
- Mức độ: Minor
- Vị trí: 0.8 điểm 4, 5, 7; 2.12 "Thêm người đi cùng" ("trẻ chỉ cần Năm sinh")
- Vấn đề:
  - (1) Điểm 4 chỉ nói xóa ảnh khi cổng xác nhận. Thiếu trường hợp **đơn hủy/không đến trước khi khai** (BR-609 b), cũng xóa ngay.
  - (2) Điểm 5 gạch 2 ghi "ảnh tự xóa sau 7 ngày". Đúng phải là "**7 ngày sau trả phòng**" (BR-609, `id_image_unconfirmed_max_days`).
  - (3) Điểm 7 "Trẻ em" không nói tuổi. Ngưỡng **dữ liệu trẻ em là dưới 16** (BR-612, `minor_data_age_threshold`), khác ngưỡng phụ thu 12. Khách 12–15 tuổi tính tiền như người lớn nhưng dữ liệu thì theo chế độ trẻ em. Sổ tay cũng không nói **không chụp giấy tờ của trẻ** khi không cần.
  - Các con số 30 ngày, 7 ngày, 3 tháng, xóa ngay khi cổng xác nhận (hạn trên 24 giờ) khớp `production-defaults.ts`. Câu "đọc số ngày trên câu hỏi đồng ý của Desk" đúng và nên giữ.
- Vì sao quan trọng: nhân viên trả lời khách về hạn lưu phải đúng. Dữ liệu trẻ em là nhóm nhạy cảm theo NĐ 13.
- Đề xuất sửa:
  - Điểm 4: "…ảnh bị xóa ngay khi cổng khai báo xác nhận, hoặc khi đơn hủy/không đến trước khi khai."
  - Điểm 5 gạch 2: "…ảnh tự xóa **7 ngày sau trả phòng**…"
  - Điểm 7: "Trẻ em: chỉ nhập **số định danh** (nếu có) và **năm sinh**, **không chụp** giấy tờ của trẻ. Với dữ liệu cá nhân, khách **dưới 16 tuổi** là trẻ em (khác mốc 12 tuổi của phụ thu)." DOM xác nhận câu nhập liệu cho khớp BR-612.

### FB-R3-SEC-BA-15
- Mức độ: Minor
- Vị trí: 0.8 điểm 3; 1.15; 2.10 bước 3; 2.11 bước 4
- Vấn đề: sổ tay nói mỗi lần **Xem đủ số / ảnh** đều ghi nhật ký, nhưng không nói **chỉ được xem khi nào**. Ở v1.0 chưa có màn xem nhật ký truy cập (1.15). Vì vậy nhân viên không thấy có ai kiểm, và câu "đều được ghi nhật ký" chưa đủ răn đe.
- Vì sao quan trọng: nhân viên xem giấy tờ của người quen, người nổi tiếng hay khách đẹp là vi phạm quyền riêng tư phổ biến nhất ở khách sạn.
- Đề xuất sửa: 0.8 điểm 3 thêm câu đầu:
  > Chỉ bấm **Xem đủ số / ảnh** khi đang làm thủ tục hoặc khai báo cho **đúng đơn đó**. Xem vì tò mò là vi phạm nội quy. Chủ đầu tư tra được ai đã xem, lúc nào (mục 1.15).

  2.11 bước 4 thêm: "Không mở cổng khai báo hay dán dữ liệu khi khách khác đang đứng nhìn màn hình."

### FB-R3-SEC-BA-16
- Mức độ: Minor
- Vị trí: 4.2 "Cọc" gạch "Sale nội bộ"
- Vấn đề: "Kiểm tiền về tài khoản OTTIMO rồi Xác nhận đã nhận cọc", nhưng sale cũng không xem được tài khoản ngân hàng, giống lễ tân (ESC-039).
- Vì sao quan trọng: không có cách kiểm thì sale sẽ tin ảnh chụp. Khoản sale ghi có cờ chờ đối soát nên rủi ro thấp hơn, nhưng vẫn giữ căn bằng cọc giả.
- Đề xuất sửa: "Sale nội bộ: gửi mã VietQR **Desk tạo** cho khách (mục 2.4). Kiểm tiền về theo **mục 2.13** (hỏi chủ đầu tư/quản lý, kèm mã đơn và số tiền) rồi mới **Xác nhận đã nhận cọc**. Ảnh chụp của khách không thay xác nhận."

### FB-R3-SEC-BA-17
- Mức độ: Minor
- Vị trí: 1.7 gạch đầu sau ảnh; ảnh `img/C1-11.png` (chữ trên Desk: "Muốn đối chiếu số đầy đủ: tạo một mã VietQR nhỏ và quét thử bằng ứng dụng ngân hàng của bạn")
- Vấn đề: chữ trên Desk bảo "tạo một mã VietQR nhỏ và quét thử". Sổ tay 1.7 bảo **không tạo đơn thử**, chỉ quét mã của đơn thật đầu tiên và **không chuyển tiền**. Hai câu ngược nhau. Câu trên Desk còn dễ hiểu thành "chuyển thử một khoản nhỏ".
- Vì sao quan trọng: đơn thử trên Desk thật làm bẩn dữ liệu tiền chỉ ghi thêm. Chuyển thử thì thành giao dịch thật phải đối soát.
- Đề xuất sửa: giữ sổ tay. Ghi lỗi chữ cho UXD sửa ở v1.0.1, câu đề xuất: "Muốn đối chiếu số đầy đủ: khi thu chuyển khoản lần đầu, quét mã VietQR của đơn đó bằng ứng dụng ngân hàng, xem tên chủ tài khoản, **không chuyển tiền**." Sổ tay thêm khung "Lỗi nhỏ đã biết (v1.0.1)" dưới ảnh C1-11: "Câu gợi ý trên màn bảo tạo mã VietQR nhỏ để quét thử: làm theo sổ tay, không tạo mã thử, không chuyển tiền."

### FB-R3-SEC-BA-18
- Mức độ: Suggestion
- Vị trí: đầu sổ tay (dòng 6); chân trang bản in HTML
- Vấn đề: dòng 6 đã đúng (không chứa mật khẩu, mã 2 bước, số tài khoản, mã cửa, số giấy tờ). Nhưng bản in phát tay không có dòng nhắc người cầm giấy cách giữ tài liệu. Ngoài ra, mục 0.4 có một câu chỉ cho chủ đầu tư: "thủ tục khôi phục riêng đã diễn tập". Câu này **không lộ chi tiết**, SEC đồng ý giữ.
- Vì sao quan trọng: sổ tay mô tả chi tiết quy trình kiểm soát tiền và giấy tờ. Đăng lên mạng xã hội thì kẻ gian biết chỗ yếu, ví dụ giờ đêm không xác nhận được chuyển khoản.
- Đề xuất sửa: UXD thêm chân trang bản in: "Tài liệu nội bộ OTTIMO – không chụp, không đăng lên mạng. Nghỉ việc thì trả lại." Chương 5.8 bảng "Xác nhận đã học" giữ ở OTTIMO, không gửi đội (như đã ghi).

---

## Điểm làm tốt (nên giữ)

- Mã cửa: cấm cả **gõ tay** và hộp thư OTA, không chỉ tin mẫu. Mỗi chương đều nhắc lại (0.9, 2.10, 2.21, 3.12, 5.4, 5.5). Link check-in **không kèm mã cửa hay số căn**. Desk tạo việc "Xóa mã trên app khóa" và sổ tay nhắc ở trả phòng, đổi phòng, rời sớm.
- 2 bước, mật khẩu tạm, mã khôi phục được viết đúng ranh giới. Sổ tay nói đủ để dùng, **không lộ thủ tục khôi phục chủ đầu tư (06.33)**, có "đưa tận tay, không gửi chat", và cấm gõ mật khẩu quản lý vào phiên lễ tân. Bình luận nguồn không in địa chỉ Desk tập vào bản phát tay. Bản HTML không còn bình luận nguồn.
- Quy tắc dữ liệu giấy tờ ở 0.8 rõ, ngắn, khớp tham số production (30 ngày / 7 ngày / 3 tháng). "Đọc số ngày trên câu hỏi đồng ý của Desk" tránh hứa sai với khách. Danh sách ảnh có quy tắc che rất tốt (chỉ một ảnh lọt, thẻ 11).

## Ghi chú cho ORC

- Thẻ 01 (d) và thẻ 08 (ý OPS/QA) là việc ngoài sổ tay. ORC giao ở bước Phản hồi.
- Thẻ 10: đề xuất thêm "Điều kiện của SEC cho A" vào `02-escalations/ESC-039.md`. **Không tạo ESC mới.**
- Thẻ 05 và 09 cần ORC/INV trả lời hai câu thực tế (app khóa cài ở máy nào; có Zalo của cơ sở trên điện thoại cơ sở chưa). Tạm ghi `[GIẢ ĐỊNH – chờ INV xác nhận]`: app khóa và Zalo cơ sở nằm trên điện thoại của cơ sở.
