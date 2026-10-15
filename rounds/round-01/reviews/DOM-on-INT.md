# Review DOM → INT – Round 1, Bước 3 (khuyến nghị – logic đồng bộ OTA)

- Người review: DOM | Ngày: 15/10/2026
- Phạm vi: `product/docs/integrations.md`, `product/docs/integrations/channel-manager-comparison.md`, `product/docs/integrations/smart-lock.md`
- Trọng tâm: quy tắc ưu tiên khi đơn OTA và đơn trực tiếp tranh cùng căn – đêm (INT nhờ ở `integrations.md` mục 3.1 và `channel-manager-comparison.md` mục 5), cùng các điểm nghiệp vụ trong tích hợp.

---

### FB-R1-DOM-INT-01
- Mức độ: Major
- Vị trí: `integrations.md` mục 3.1 "Chống đặt trùng" bước 3 ("Quy tắc nghiệp vụ ưu tiên ai → DOM định nghĩa"); `channel-manager-comparison.md` mục 5; liên quan ARC E2, BR-312, US-139
- Vấn đề: Cơ chế kỹ thuật (đơn xung đột không bị từ chối im lặng, cảnh báo, đối soát đêm) đã có, nhưng chưa có quy tắc nghiệp vụ quyết định **gán căn nào, dời ai, ai quyết, trong bao lâu**. BR-312 hiện tại của DOM còn sơ lược (DOM nhận lỗi – DOM-on-PO B.15).
- Vì sao quan trọng: "Khách đến không có phòng" là sự cố nặng nhất (RI1). Ngoài thiệt hại uy tín, nó còn tốn tiền thật: OTA phạt chủ nhà khi chủ nhà hủy (Airbnb phạt phí và khóa lịch, Booking.com yêu cầu chỗ ở thay thế), và đánh giá xấu kéo giảm thứ hạng trên OTA.
- Đề xuất sửa: INT ghi các quy tắc sau vào mục 3.1 (DOM chốt, sẽ viết thành BR-312 ở bước 4):
  1. **Không bao giờ từ chối hay tự hủy đơn OTA** đã về: luôn tạo `confirmed` (khớp BA/ARC). OTTIMO tự hủy một đơn OTA cần MGR+ duyệt và là phương án cuối cùng.
  2. **Tự gán căn cho đơn OTA mới**: (a) căn ánh xạ, với kênh đăng từng căn như Airbnb; (b) căn trống **cùng nhóm**, ưu tiên `VI`/`VC` rồi đến căn ít tạo đêm lẻ nhất; (c) **không tự gán sang nhóm khác**, chỉ gợi ý để lễ tân hoặc quản lý bấm chọn (nâng hạng có giá). Không còn căn → đơn xung đột "chưa gán căn" (ARC).
  3. **Khi trùng thật (cùng căn – đêm), ai giữ căn**: đơn được **server xác nhận trước** giữ căn. Tính theo thời điểm ghi nhận trong app, không theo thời điểm OTA tạo đơn. Đơn đến sau được dời. Ngoại lệ, những đơn **không bao giờ bị dời**: khách đang ở (`in_house`), khách dài hạn, khách VIP/quen, đơn Airbnb đặt đúng căn trong ảnh (dời sang căn khác cùng nhóm vẫn được nếu khách đồng ý).
  4. **Thứ tự phương án dời**: (i) đổi sang căn trống cùng nhóm, khách không cảm nhận khác biệt (lễ tân tự làm); (ii) nâng hạng miễn phí sang nhóm khác (lễ tân trưởng trở lên xác nhận); (iii) chuyển khách sang cơ sở tương đương gần đó, OTTIMO trả chênh lệch đêm đầu + xe (MGR+ duyệt, chi phí ghi vào báo cáo xung đột). Khi buộc phải chuyển khách ra ngoài, **ưu tiên chọn khách trực tiếp/CTV** (liên lạc được, linh hoạt bù đắp được, không bị OTA phạt), nhưng chỉ khi khách đồng ý; không thì chuyển đơn đến sau.
  5. **Thời hạn xử lý**: ngày đến ≤ 24 giờ → báo đỏ ngay cho lễ tân + quản lý, phải có phương án trong 1 giờ; ngày đến xa hơn → "Cần chú ý", phương án trước 12:00 hôm sau. Liên hệ khách **trước** khi khách lên đường.
  6. **Khi đồng bộ lỗi kéo dài** (CM không nhận lệnh > 15 phút – tham số): cảnh báo đỏ, kèm checklist cho quản lý **đóng bán thủ công trên extranet** những ngày còn ≤ 1 căn trống mỗi nhóm. Khi có lại kết nối thì đối soát toàn bộ.
  7. **Ghi nhận**: mỗi xung đột có bản ghi (nguyên nhân, phương án, chi phí) để DATA báo cáo số vụ/tháng (mục tiêu S1 = 0).
- Trạng thái: Open

### FB-R1-DOM-INT-02
- Mức độ: Major
- Vị trí: `integrations.md` I5 ("Phát hành hóa đơn điện tử… **mỗi lần thu tiền**"), mục 3.3 ("Mỗi lần thu tiền → tạo yêu cầu phát hành")
- Vấn đề: BR-524 đặt thời điểm xuất hóa đơn: ngắn ngày **khi hoàn tất trả phòng**, dài hạn **mỗi kỳ thu**, điện nước **mỗi tháng**. BR-523 nói ký quỹ không xuất hóa đơn. Nếu phát hành "mỗi lần thu tiền" thì cọc 30% của đơn ngắn ngày cũng ra hóa đơn. Khi khách hủy và được hoàn, kế toán phải lập hóa đơn điều chỉnh/thay thế. Một đơn thu 3 lần sẽ thành 3 hóa đơn, khách công ty khó quyết toán.
- Vì sao quan trọng: Hóa đơn sai thời điểm hoặc sai đối tượng là rủi ro thuế. Theo hiểu biết của DOM (**kế toán phải xác nhận**), tiền đặt cọc để đảm bảo thực hiện hợp đồng không phải thời điểm lập hóa đơn, còn tiền thuê dài hạn thu trước theo kỳ thì phải lập khi thu.
- Đề xuất sửa: Đổi I5 và 3.3 thành "phát hành theo **sự kiện nghiệp vụ** của BR-524 (trả phòng / kỳ thu dài hạn được thanh toán / hóa đơn điện nước tháng), không theo từng giao dịch thu". Thêm `invoice_trigger` cấu hình được để kế toán chỉnh. Ghi vào ESC-008 (câu loại hình kinh doanh – DOM-on-PO FB-09).
- Trạng thái: Open

### FB-R1-DOM-INT-03
- Mức độ: Major
- Vị trí: `smart-lock.md` mục 1.5, mục 4.2 bước 1, mục 5 ("`ddmm` + **2 số ngẫu nhiên**"); decision-log INT cùng nội dung
- Vấn đề: Decision-log SEC đã chốt sau INT: "biến thể sinh nhật cần **≥ 3 số ngẫu nhiên** hoặc khóa có giới hạn thử sai". Tài liệu INT (và ESC-011 của PO, BR-403 của DOM) vẫn ghi 2 số.
- Vì sao quan trọng: Ngày sinh có trên giấy tờ khách đưa cho lễ tân và trên mạng xã hội. Với 2 số ngẫu nhiên chỉ còn 100 tổ hợp. Đây là an ninh phòng của khách.
- Đề xuất sửa: Đổi thành "`ddmm` + 3 số ngẫu nhiên (7 số); hoặc + 2 số **chỉ khi** khóa xác nhận có khóa tạm sau N lần nhập sai (INT kiểm khi biết hãng)". Thêm tiêu chí T11 "khóa tạm khi nhập sai nhiều lần" vào bảng tiêu chí mục 3. Sửa dòng decision-log INT cho khớp (ORC).
- Trạng thái: Open

### FB-R1-DOM-INT-04
- Mức độ: Minor
- Vị trí: `integrations.md` I9 ("trước 23:00 ngày đến"), mục 3.5 ("Nhắc hạn 23:00 bằng job"), RI6
- Vấn đề: Một mốc 23:00 cho mọi khách là mốc của BL. BR-602/603 tách hạn công dân VN và người nước ngoài; người nước ngoài tính **từ giờ đến** (BR-603, DOM sẽ sửa thành "giờ đến + 12 giờ", luật sư xác nhận).
- Vì sao quan trọng: Job nhắc cố định 23:00 sẽ nhắc muộn với khách NN đến buổi sáng (hạn 20:00).
- Đề xuất sửa: Ghi "hạn theo BR-602/BR-603, tham số hóa; job nhắc trước hạn X giờ" thay cho "23:00".
- Trạng thái: Open

### FB-R1-DOM-INT-05
- Mức độ: Minor
- Vị trí: `integrations.md` mục 3.1 "Dữ liệu nhận về"; decision-log SEC (không kéo thẻ ảo VCC); BR-307, BR-901
- Vấn đề: Mục 3.1 mới ghi "đơn mới / sửa / hủy". Thiếu ba việc OTA gây phát sinh hằng tuần: (a) **OTA sửa đơn** (đổi ngày, đổi số khách, hủy một phần đêm). App phải kiểm trùng lại và cập nhật số người khai báo (cùng thẻ DOM-on-BA FB-06). (b) **Báo no-show lên kênh** (US-136 tạo việc thủ công). Cần biết CM có API đánh dấu no-show hay lễ tân phải vào extranet. (c) **Thu tiền đơn OTA**: đơn "OTA thu hộ" mà OTA thanh toán cho khách sạn bằng thẻ ảo, trong khi SEC đã chốt không kéo VCC qua CM. Phải có bước nghiệp vụ "ai vào extranet trừ thẻ ảo, khi nào", và đối soát tiền OTA chuyển về với phí kênh thực tế (BR-901).
- Vì sao quan trọng: (a) gây đặt trùng hoặc thiếu khai báo; (b) không báo no-show thì OTA vẫn tính hoa hồng; (c) quên trừ thẻ ảo là mất tiền phòng, vì thẻ ảo có hạn sử dụng.
- Đề xuất sửa: Thêm 3 dòng vào mục 3.1, mỗi dòng ghi "CM có API không (Beds24 – cần INT kiểm)" và phương án thủ công nếu không có: việc nhắc cho lễ tân/quản lý kèm hạn, ví dụ "trừ VCC Booking trong ngày khách đến". DOM bổ sung BR-307 cho phần (c).
- Trạng thái: Open

### FB-R1-DOM-INT-06
- Mức độ: Suggestion
- Vị trí: `integrations.md` I8 (email là kênh chính cho khách NN), H-10 của UXR (OTA che email)
- Vấn đề: Khách OTA thường không có email thật (Airbnb không cung cấp email, Booking/Agoda dùng email chuyển tiếp), nên link check-in gửi qua email có tỷ lệ mở thấp.
- Vì sao quan trọng: Check-in online (S5 ≥ 40%) và chuẩn bị khai báo trước phụ thuộc vào việc khách OTA nhận được link.
- Đề xuất sửa: Kiểm xem Beds24 API có cho **gửi tin nhắn vào hộp thư của OTA** (Airbnb, Booking.com) không (theo hiểu biết của DOM thì nhiều CM có tính năng này – **cần INT kiểm**). Nếu có, đặt kênh này là kênh mặc định gửi link check-in cho đơn OTA; email chỉ là dự phòng.
- Trạng thái: Open

### FB-R1-DOM-INT-07
- Mức độ: Suggestion
- Vị trí: `smart-lock.md` mục 4.1, mục 3 (T2 gateway bắt buộc)
- Vấn đề: (a) Chưa có quy tắc **mã của nhân viên**. Buồng phòng và kỹ thuật vào phòng có khách bằng mã nào, có nhật ký không. (b) T2 xếp gateway là bắt buộc. Theo hiểu biết của DOM, một số nền tảng (ví dụ TTLock) tạo được mã có thời hạn theo thuật toán mà khóa tự kiểm, **không cần gateway** (**cần INT kiểm theo tài liệu hãng**).
- Vì sao quan trọng: (a) Khi khách báo mất đồ, nhật ký mở cửa theo từng nhân viên, đối chiếu với việc dọn trong app, là bằng chứng bảo vệ cả khách lẫn nhân viên. (b) Nếu không cần gateway thì chi phí và rủi ro mất mạng ở khóa giảm, và tự động hóa mã có thể sớm hơn.
- Đề xuất sửa: (a) Thêm vào mục 4: mỗi nhân viên có mã riêng, có giới hạn khung giờ làm; mã chủ/khẩn cấp chỉ quản lý giữ; nhật ký mở cửa (T6) đối chiếu với việc buồng phòng. (b) Thêm cột "mã có hạn không cần gateway" vào bảng hãng và hạ T2 xuống "Nên có" nếu được xác nhận.
- Trạng thái: Open

### FB-R1-DOM-INT-08
- Mức độ: Suggestion
- Vị trí: `integrations.md` mục 3.1 "Dữ liệu đẩy đi" (đã có "ở tối thiểu, đóng/mở bán")
- Vấn đề: Đã có đẩy "ở tối thiểu" nhưng chưa nối với quy tắc nghiệp vụ nào (BR chưa có `min_stay` – DOM sẽ thêm, DOM-on-PO B.16 và FB-PO-13).
- Vì sao quan trọng: Cuối tuần và lễ ở Đà Lạt, "ở tối thiểu 2 đêm" và "không nhận khách đến ngày X" (CTA) là công cụ chính để tránh đêm lẻ không bán được.
- Đề xuất sửa: Ghi rõ adapter cần hỗ trợ: ở tối thiểu theo ngày đến, đóng nhận khách đến (CTA), đóng nhận khách đi (CTD) theo nhóm × ngày × kênh. Kiểm Beds24 hỗ trợ đủ không.
- Trạng thái: Open

---

## Điểm làm tốt
1. Nguyên tắc "app là nguồn dữ liệu chính, mọi tích hợp sau adapter có Mock, đơn OTA xung đột không bị từ chối im lặng, đối soát hằng đêm" đúng với cách một PMS nghiêm túc phải làm để không đặt trùng.
2. So sánh channel manager đặt yêu cầu bắt buộc (6/6 OTA + API cho hệ thống riêng) **trước** khi so giá, nên loại được phương án rẻ nhưng buộc nhân viên nhập 2 nơi. Mọi con số đều gắn nhãn [Nguồn]/[Chưa xác minh].
3. Kiên quyết không scraping cổng Bộ Công an và chỉ ghi nhận tiền từ IPN có chữ ký. Đây là hai rủi ro pháp lý và rủi ro tiền mà đội nhỏ hay xem nhẹ.
