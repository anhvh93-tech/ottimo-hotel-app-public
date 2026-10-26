# Hành trình nhắn tin với khách – OTTIMO Boutique Stay

- Tác giả: DOM | Round 2 (giữa Sprint 3 và Sprint 4) | Ngày: 17/10/2026 | Phiên bản: **0.1 – bản nháp, chờ PO + BA review** (protocol mục 5: DOM → PO, BA)
- **Cập nhật 17/10 (Sprint 4 khởi động):** BR-971…983 đã chuyển vào `product/docs/business-rules.md` v0.3.5, nhóm 12B, và đã gộp thẻ SEC DOM-01…06. Khi số liệu lệch nhau, **business-rules.md là nguồn chính**. Thay đổi chính so với mục 7–8 dưới đây:
  - khung gửi tin theo lịch là **[08:00, 21:00)** (không phải [07:00, 21:00)), mọi mốc "dời sang 07:00" đọc là 08:00;
  - mã cửa không gửi qua Zalo hay hội thoại OTA;
  - có `contact_source`;
  - mã đặt trực tiếp đi bằng tin riêng.
  
  INV đã quyết ESC-021 A + K1-A (dự thảo ESC ở mục 9 nay là ESC-021).
- Lý do làm: tin nhắn của INV ngày 17/10/2026 – hỏi các bước gửi check-in online, nhắc ngày nhận phòng, gửi vị trí, kênh tương tác; INV muốn dùng **Zalo OA** để chăm sóc khách.
- Đầu vào: `00-brief/investor-brief.md`; `04-investor-feedback/FB-INV-001.md`; `product/docs/PRD.md` (M13, M15, A6); `03-backlog/backlog.md` (EP18, US-034, 040, 077, 108, 116, 125, 126, 138, 141); `product/docs/integrations.md` (I7, I8, 3.1.3, 3.4, ESC-INT-B); `product/docs/hosting-plan.md` 5.1; `02-escalations/ESC-010.md`; `product/docs/business-rules.md` v0.3.4; `product/design/content-guide.md` mục 1, 7; `product/docs/security/security-requirements.md` (SR-GST, SR-LOCK, SR-MSG); `product/docs/security/data-risk-assessment.md` (P01–P11); `product/docs/erd.md` (`message_template`, `message_log`, `consent_record`).
- Phạm vi: **lịch chạm khách** (touchpoint) từ lúc đặt đến sau trả phòng, cho khách ngắn ngày và dài hạn. Không viết câu chữ cuối (UXD viết theo content-guide). Không chọn nhà cung cấp, không thiết kế API (INT, ARC). **Không sửa `business-rules.md`** – BR mới để ở mục 7 dạng dự thảo.

### Quy ước nhãn
| Nhãn | Nghĩa |
|---|---|
| NGÀNH | Cách làm chuẩn ngành, DOM tự chốt |
| [GĐ] | `[GIẢ ĐỊNH – chờ INV xác nhận]` – giá trị riêng của OTTIMO, dùng tạm để đi tiếp |
| PHÁP LÝ | Liên quan luật – DOM hiểu như vậy, **không phải ý kiến pháp lý**, cần luật sư (ESC-001) |
| [Nguồn] | Đã mở trang chính thức ngày 17/10/2026 – link ở mục 13 |
| [Nguồn – qua tìm kiếm] | Trang chính thức không mở được (403/trang động); chỉ đọc qua kết quả tìm kiếm |
| [Bên thứ ba] | Tài liệu của đối tác/bài viết, không phải văn bản của chủ kênh |
| [Chưa xác minh] | Chưa tìm được nguồn; phải kiểm trên tài khoản thật hoặc hỏi nhà cung cấp |

Ký hiệu ngày: **D** = ngày đến của đơn; **R** = ngày trả phòng; D-2 = 2 ngày lịch trước ngày đến; R+1 = ngày sau ngày trả. Giờ theo Asia/Ho_Chi_Minh (BR-001). Tin nhắn dùng **ngày lịch**, không dùng ngày nghiệp vụ 06:00 (BR-010) – trừ khi ghi khác.

---

## 0. Tóm tắt cho ORC

1. Một lượt khách ngắn ngày có **9 điểm chạm chủ động** (xác nhận → mời/nhắc check-in online → nhắc D-1 → ngày đến → chào sau nhận phòng → hỏi thăm giữa kỳ → nhắc trả phòng → cảm ơn + bill → mời đánh giá). Khách dài hạn thêm 4 điểm chạm định kỳ (hỏi thăm tuần, kỳ thu, điện nước, gia hạn/kết thúc HĐ).
2. Tin chia 3 loại: **vận hành** (không cần đồng ý riêng), **đánh giá/khảo sát** và **marketing** (cần đồng ý riêng từng người – DRA P06, P07). Mã đặt trực tiếp là marketing.
3. **Khách OTA**: chỉ nhắn trong hội thoại OTA; **không** gửi mã đặt trực tiếp qua bất kỳ kênh nào. Airbnb cấm link ra ngoài trong tin nhắn [Nguồn] → khách Airbnb không nhận link check-in qua Airbnb.
4. **Zalo OA** hợp với khách Việt: chat 2 chiều + tin mẫu ZBS (tên mới của ZNS) theo SĐT, khoảng **200–300 đ/tin chưa VAT** [Nguồn]. Ước 150–250 tin/tháng → **khoảng 30.000–75.000 đ/tháng** [ước tính DOM]. Khách nước ngoài: email (đã có) + WhatsApp của cơ sở gửi tay.
5. Việc này **đổi quyết định ESC-010 phương án B** (ZNS để sau MVP) → cần INV quyết lại: dự thảo ESC ở mục 9 (ORC cấp số).
6. Làm được ngay ở R3 khi **chưa có tài khoản Zalo**: Desk sinh danh sách **"Tin cần gửi hôm nay"** theo lịch này, lễ tân bấm sao chép (adapter `manual_copy`). Có OA thì đổi sang tự gửi, không đổi lịch.
7. Đề xuất 13 BR mới (BR-971…983, dự thảo) và ~30 tham số (mục 8).

---

## 1. Hiện trạng và khoảng trống

| Hạng mục | R2 hiện tại | Đã lên kế hoạch | Khoảng trống DOM thấy |
|---|---|---|---|
| Link check-in online | Lễ tân sao chép link (GuestLinkPanel) dán vào Zalo/OTA | – | Không có lịch nhắc; không biết khách nào chưa làm trước ngày đến |
| Báo giá, xác nhận | Sao chép văn bản báo giá | Mẫu tin VI/EN/RU (US-125, R3) | Chỉ 8 mẫu; thiếu mẫu D-1, chào nhận phòng, hỏi thăm, kỳ thu |
| Địa chỉ, chỉ đường | Trang khách `g.` (US-108) | – | Khách chỉ thấy khi mở link; chưa có tin D-1 mang địa chỉ + đỗ xe |
| Nhắc trả phòng | Thẻ trạng thái trên Desk theo BR-425 | Tự gửi cho khách (US-034, R3) | – |
| Tự gửi tin | Không có | Zalo OA/ZNS + email (US-126, Should R3) | ESC-010 B đã hoãn ZNS – nay INV muốn dùng |
| Cảm ơn, đánh giá, mã quay lại | Không có | US-116 (Should R3) | Chưa phân biệt khách OTA với khách trực tiếp; chưa tách mã giảm khỏi lời mời đánh giá |
| Đồng ý nhận ưu đãi | Trường 3 trạng thái (BR-955) | Ghi đồng ý từng người (US-077, R3) | Chưa có cách hỏi đồng ý trên app khách/landing page |

---

## 2. Nguyên tắc chung (DOM chốt – NGÀNH, trừ chỗ ghi nhãn khác)

1. **Một nguồn dữ liệu.** Mọi tin lấy dữ liệu từ đơn trong Desk. Không gõ tay giờ, giá, phí. Con số lấy từ tham số BR (content-guide mục 2).
2. **Mỗi tin một việc, một nút chính.** Ví dụ tin D-1 có một nút "Làm thủ tục trước". Thông tin phụ để ở trang `g.`.
3. **Ba loại tin** (theo DRA P04, P06, P07):
   - **Vận hành (VH)**: cần để phục vụ lưu trú – xác nhận, hướng dẫn đến, nhắc giờ, bill, nhắc tiền thuê, sự cố, hỏi thăm "Mọi thứ ổn chứ?". Không cần ô đồng ý riêng; khách được báo trước trong thông báo xử lý dữ liệu.
   - **Đánh giá (ĐG)**: mời đánh giá, khảo sát hài lòng. Cần đồng ý (P07) – luật sư xác nhận có gộp với P06 được không. PHÁP LÝ.
   - **Marketing (MKT)**: mã giảm, ưu đãi, mời quay lại, bản tin. Cần đồng ý **từng người** (P06, BR-955). Mỗi tin có cách từ chối.
4. **Không trộn loại.** Tin VH không chứa ưu đãi. Lý do: tin mẫu ZNS/ZBS không cho nội dung quảng cáo [Bên thứ ba]; Google cấm tặng ưu đãi để đổi lấy đánh giá [Nguồn – qua tìm kiếm].
5. **Kênh theo khách, không theo thói quen nhân viên.** Thứ tự chọn kênh ở BR-972 (mục 7).
6. **Giờ gửi**: tin chủ động trong **[07:00, 21:00)**. Ngoài khung thì dời sang 07:00, trừ ngoại lệ (BR-973). Đà Lạt là điểm nghỉ dưỡng – khách không muốn nhận tin lúc khuya.
7. **Tối đa 2 tin chủ động/ngày/đơn**; tin gần nhau thì gộp (BR-974). Không tính tin trả lời khách và tin sự cố.
8. **Đã làm thì không nhắc.** Khách đã check-in online → bỏ nhắc check-in. Khách đã chọn giờ trả trên app → bỏ nhắc trả phòng lần 2.
9. **Tin có hạn gửi.** Tin trễ quá hạn thì bỏ, không gửi muộn; tạo việc cho lễ tân (BR-980).
10. **Không gửi qua tin nhắn**: số/ảnh giấy tờ (R-REG-08), số thẻ (R-PAY-05), mã xác minh kèm link (SR-GST-13). Mã cửa chỉ qua app khách mức 2 hoặc mẫu `door_code` đúng ngày đến, không kèm địa chỉ/số căn (SR-LOCK-03). Wi-Fi chỉ từ lúc nhận phòng (US-108 AC2).
11. **Nhắn bằng tài khoản của cơ sở**, trên thiết bị của cơ sở – không Zalo/WhatsApp cá nhân của nhân viên (SR-DEV-08, TM-17). Ca sau đọc được hội thoại ca trước.
12. **Ghi nhật ký mọi tin** (gửi tay hoặc tự động) vào `message_log`: điểm chạm, kênh, thời điểm, trạng thái, người gửi. Không lưu nội dung đã điền (SR-MSG-01).
13. **Ngôn ngữ** theo hồ sơ khách: VI / EN / RU (RU cần người bản ngữ duyệt – content-guide mục 7). Không rõ: SĐT +84 → VI, còn lại → EN.
14. **Giọng văn** theo content-guide mục 1: chủ nhà boutique, ấm, lịch sự, không khách sáo; VI xưng "bạn"; câu ≤ 20 từ; lợi ích trước. Ký cuối tin: "OTTIMO Boutique Stay" (+ tên lễ tân khi gửi tay).

---

## 3. Ma trận kênh theo loại khách

| Loại khách | Kênh chính | Dự phòng | Ghi chú |
|---|---|---|---|
| Khách Việt đặt trực tiếp (Zalo/điện thoại/web) hoặc qua CTV | **Zalo** – R2/R3: Zalo của cơ sở, gửi tay; khi có OA: tin mẫu ZBS theo SĐT + chat OA | Gọi điện; email nếu có | ZBS cần SĐT có tài khoản Zalo [Bên thứ ba]. Khách CTV: OTTIMO nhắn trực tiếp sau khi xác nhận; CTV thấy trạng thái trên Desk |
| Khách nước ngoài đặt trực tiếp | **Email** (SES – I8, đã có từ R2) | WhatsApp của cơ sở gửi tay; Telegram cho khách Nga nếu khách chọn [Chưa xác minh nhu cầu thật – H-12] | WhatsApp: ngoài 24 giờ sau tin cuối của khách chỉ gửi được tin mẫu đã duyệt và cần khách đồng ý trước – áp khi dùng API [Nguồn – qua tìm kiếm]. MVP gửi tay |
| Khách Booking.com, Agoda, Expedia, Trip.com, Traveloka | **Hội thoại đơn trên OTA** (R2/R3 gửi tay; API Beds24 khi INT xác nhận kênh) | Email ẩn danh của OTA | Xem mục 5. Chuyển sang Zalo/WhatsApp chỉ khi khách tự đề nghị sau khi đặt |
| Khách Airbnb | **Chỉ hội thoại Airbnb**, không link | – | Airbnb cấm link ra ngoài trong tin nhắn [Nguồn]. Khai báo giấy tờ làm tại quầy (mục 5) |
| Khách dài hạn | Zalo (khách Việt) / WhatsApp, Telegram, email (khách nước ngoài) – **hội thoại 1-1**, không nhóm chung nhiều khách | Gọi điện; app khách (hóa đơn, yêu cầu – R3) | Brief 5: hiện chủ yếu qua nhóm chat. Không nhận ảnh giấy tờ qua chat (R-REG-08) |
| Đơn nhóm/đoàn (BR-321…326) | Người đặt (đầu mối) | Trưởng từng căn nếu tự để lại liên hệ | Nội quy in sẵn trong từng căn (bằng chứng BR-511 – BR-977) |

---

## 4. Lịch chạm khách – tổng quan

| Mã | Điểm chạm | Khi nào (mặc định) | Loại | Ngắn ngày | Dài hạn | OTA | Hiện trạng → đề xuất |
|---|---|---|---|---|---|---|---|
| TP-00 | Giữ chỗ chờ cọc | Lúc tạo giữ chỗ; nhắc khi còn 2 giờ | VH | Có | Có | – | R2 có văn bản báo giá + VietQR; nhắc do sale gửi tay (BR-303) |
| TP-01 | Xác nhận đặt phòng | Ngay khi `confirmed` | VH | Có | Có | Có (ngắn) | R2 tay → R3 tự gửi (US-126) |
| TP-02 | Mời + nhắc check-in online | Trực tiếp: kèm TP-01; OTA: D-4 10:00; nhắc D-2 10:00 | VH | Có | Có | Có (trừ Airbnb) | R2 tay → R3 tự gửi |
| TP-03 | Nhắc trước 1 ngày | D-1 10:00 | VH | Có | Có | Có | Mới |
| TP-04 | Ngày đến | D 09:00 – chỉ khi có việc | VH | Có | Có | Có | Mới |
| TP-05 | Chào sau nhận phòng (đêm đầu) | Nhận phòng thực tế + 60 phút | VH | Có | Có | Có | Mới – là bằng chứng nội quy BR-511 |
| TP-06 | Hỏi thăm giữa kỳ | Ngắn ngày: ngày thứ 2, 10:00 (đơn ≥ 3 đêm); dài hạn: mỗi 7 ngày | VH | Có | Có | Có | Mới (BL 5.18 bước 1) |
| TP-07 | Nhắc trả phòng | R-1 20:00; R 09:00 (BR-425) | VH | Có | Có (R-7, R-1) | Có | Desk có thẻ trạng thái → R3 tự gửi (US-034) |
| TP-08 | Cảm ơn + bill | `checked_out` + 30 phút | VH | Có | Có | Có (qua OTA) | R3 (US-040, US-116) |
| TP-09 | Mời đánh giá | R+1 10:00 | ĐG | Có | Có | Không (OTA tự mời) | R3 (US-116) |
| TP-10 | Mã đặt trực tiếp | Kèm bill/email cảm ơn – khối tách riêng | MKT | Chỉ kênh trực tiếp/CTV + đã đồng ý | Như ngắn ngày | **Không bao giờ** | R3 (US-116, BR-111) |
| TP-11 | Nhắc kỳ thu tiền thuê | Hạn − 7 ngày 10:00; ngày hạn 09:00 | VH | – | Có | – | R3 (US-012 AC2, US-088) |
| TP-12 | Hóa đơn điện nước tháng | Khi chốt công tơ xong | VH | – | Có | – | R3 (BR-504) |
| TP-13 | Chào gia hạn HĐ + nhắc thị thực | HĐ hết − 30 ngày; thị thực hết − 30 ngày | VH | – | Có | – | R3 (BR-211, BR-605) |
| TP-14 | Trả phòng cuối HĐ | R-7, R-1 | VH | – | Có | – | R3 (BR-425, BR-214) |
| TP-15 | Tin theo sự kiện | Khi xảy ra | VH | Có | Có | Có | Một phần đã có mẫu (`msg.hot_water_issue`) |

**Ví dụ lịch một đơn** (ngắn ngày, trực tiếp, khách Việt): căn 202, đặt 15/10/2026, đến Thứ Sáu 23/10, đi Thứ Hai 26/10 (3 đêm, đúng ở tối thiểu BR-113):
TP-01 15/10 ngay khi nhận cọc · TP-02 nhắc 21/10 10:00 (nếu chưa làm) · TP-03 22/10 10:00 · TP-05 23/10 15:10 (nhận 14:10) · TP-06 24/10 10:00 · TP-07 25/10 20:00 và 26/10 09:00 · TP-08 26/10 12:10 (trả 11:40) · TP-09 27/10 10:00. Tổng **8–9 tin**, không ngày nào quá 2 tin.

---

## 5. Khách đặt qua OTA – điều OTA cho phép

| Kênh | Nhắn bằng gì | Link trong tin | Chuyển sang Zalo/WhatsApp | Marketing, mã đặt trực tiếp | Mức chắc chắn |
|---|---|---|---|---|---|
| **Airbnb** | Hội thoại theo đặt phòng | **Cấm** link đưa người dùng ra khỏi Airbnb, không có ngoại lệ cho hướng dẫn nhận phòng | Chỉ khi **khách đề nghị** sau khi đặt; vẫn phải theo các quy định khác | **Cấm**: chào đặt ngoài Airbnb, giảm giá để đặt ngoài, dùng liên hệ của khách để marketing. Được yêu cầu giấy tờ trước khi đến **nếu luật bắt buộc**, phải ghi trong mô tả listing | [Nguồn] airbnb.com/help/article/2799 |
| **Booking.com** | Hội thoại đơn trên extranet; có mẫu tin hẹn giờ; nhắn được từ lúc đặt đến 7 ngày sau trả phòng/hủy | Chỉ link nằm trong **danh sách link được phép** (phải thêm tên miền `g.<tên-miền>`); link khác bị gỡ | Hướng dẫn của Booking.com: giữ trao đổi trên nền tảng | Email khách là địa chỉ ẩn (`@guest.booking.com`); không dùng để marketing sau lưu trú [Bên thứ ba] | [Nguồn – qua tìm kiếm] partner.booking.com (trang trả 403) – cần kiểm trên extranet |
| **Booking.com** (thêm) | Booking.com tự gửi lời mời check-in online của họ 48 giờ trước khi đến, khuyên chỗ nghỉ không gửi hướng dẫn mâu thuẫn | – | – | – | [Nguồn – qua tìm kiếm] |
| **Agoda** | Customer Messaging System trong YCS; phải xin Agoda bật; chỉ nhắn khi đơn đã xác nhận | [Chưa xác minh] | [Chưa xác minh] | [Chưa xác minh] – mặc định **không** | `integrations.md` 3.1.3 [Nguồn] |
| **Expedia, Trip.com, Traveloka** | [Chưa xác minh] | [Chưa xác minh] | [Chưa xác minh] | Expedia: marketing không nằm trong mục đích được dùng dữ liệu khách [Bên thứ ba] | Cần INT kiểm trên tài khoản thật |

**Quy tắc DOM cho đơn OTA** (đề xuất BR-981):
1. Chỉ gửi tin **vận hành**, trong hội thoại OTA. Không gửi TP-09 (OTA tự mời đánh giá), không gửi TP-10.
2. **Airbnb**: tin bằng chữ, không link, không mã giảm. Khách làm giấy tờ tại quầy. Muốn dùng check-in online cho khách Airbnb: (a) mô tả listing ghi rõ "theo luật Việt Nam phải khai báo lưu trú bằng giấy tờ" (Airbnb cho phép khi luật bắt buộc); (b) chỉ gửi link qua kênh khác khi **khách đề nghị**. Cách diễn đạt cụ thể: INT + INV kiểm với Airbnb [Chưa xác minh].
3. **Booking.com**: thêm `g.<tên-miền>` vào danh sách link được phép trước khi gửi link check-in. Gửi lời mời D-4 (trước lời mời 48 giờ của Booking.com) và nói rõ đây là khai báo lưu trú theo luật Việt Nam, để khách không nhầm với check-in của Booking.com.
4. **Không in mã đặt trực tiếp trên bill của đơn OTA** (prototype in OTTIMO-BACK5 cho mọi bill – BL 3.8; R2 hiện chưa in). Áp cho US-040 ở R3.
5. Khách OTA **tự** theo dõi Zalo OA hoặc **tự** đăng ký nhận tin trên landing page bằng liên hệ của chính họ, có đồng ý → từ đó là khách của OTTIMO. Vùng xám với chính sách OTA → INV quyết ở câu phụ ESC (mục 9).
6. Thẻ/QR trong phòng (dùng chung mọi kênh): chỉ trỏ trang công khai của căn (SR-GST-12) với nút "Theo dõi Zalo OA". **Không in mã giảm** trên thẻ trong phòng.

---

## 6. Chi tiết từng điểm chạm

Mỗi thẻ có: Kích hoạt · Thời điểm (tham số) · Kênh · Nội dung · Loại/đồng ý · Giọng · Không phản hồi → lễ tân làm gì · Mẫu tin. Tham số tổng hợp ở mục 8.

### TP-00 · Giữ chỗ chờ cọc (khách trực tiếp/CTV)
| Mục | Nội dung |
|---|---|
| Kích hoạt | Tạo đơn `hold` (BR-302) |
| Thời điểm | Ngay khi tạo; nhắc khi còn `hold_expiry_reminder_hours` (2 giờ) – BR-303 |
| Kênh | Kênh khách đang hỏi (Zalo/WhatsApp/email) – sale gửi |
| Nội dung | Căn, ngày, số đêm, tổng, **cọc 30%** (BR-305), mã VietQR theo số cọc, **hạn giữ chỗ** (giờ cụ thể, không vượt 12:00 ngày đến – BR-302), chính sách hủy ngắn (BR-309) |
| Loại | VH |
| Giọng | Rõ, không giục. "Căn 202 đang được giữ cho bạn đến 20:00 ngày 16/10." |
| Không phản hồi | Hết hạn chưa cọc → hệ thống tự hủy (BR-303), báo sale. Sale nhắn 1 tin "đã mở lại căn, cần thì báo" – không gửi thêm |
| Mẫu | Có: văn bản báo giá R2; `msg.deposit_received` (US-125). Mới: `msg.hold_expiring` |

### TP-01 · Xác nhận đặt phòng
| Mục | Nội dung |
|---|---|
| Kích hoạt | Đơn chuyển `confirmed` (trực tiếp: nhận đủ cọc hoặc quản lý duyệt; OTA: đơn về Desk) |
| Thời điểm | Ngay, trong ≤ 15 phút. Ngoài [07:00, 21:00) → 07:00 sáng sau, **trừ** đơn có ngày đến ≤ hôm sau → gửi ngay. OTA: trong 24 giờ sau khi đơn về, trong khung giờ (OTA đã gửi xác nhận của họ) |
| Kênh | Theo mục 3. OTA: hội thoại OTA |
| Nội dung | Mã đơn, căn/nhóm căn, ngày đến – đi, số đêm, giờ nhận/trả (BR-401), đã cọc / còn lại (trực tiếp), chính sách hủy ngắn (BR-309; OTA: "theo chính sách trên <OTA>"), **link check-in online + hạn** (trực tiếp; OTA để TP-02), số liên hệ + giờ trực (BR-811) |
| Loại | VH |
| Giọng | Vui, chắc chắn. Câu đầu nói điều khách cần nghe: "Đặt phòng của bạn đã xác nhận." |
| Không phản hồi | Không cần khách trả lời. Gửi lỗi (SĐT không có Zalo, email trả về) → kênh dự phòng; vẫn lỗi → việc "Xác nhận liên hệ khách" cho lễ tân trong ngày |
| Đặt sát ngày | Ngày đến là hôm nay hoặc ngày mai: gộp TP-01 + TP-02 + TP-03 vào **một tin** |
| Mẫu | `msg.booking_confirmed` (có). Mới: `msg.ota_welcome` (OTA, không giá, không chính sách hủy) |

### TP-02 · Mời và nhắc check-in online
| Mục | Nội dung |
|---|---|
| Kích hoạt | Mời: trực tiếp – nằm trong TP-01; OTA – D-4. Nhắc: khai báo của đơn vẫn `none` (chưa có `pre` – BR-607) |
| Thời điểm | Mời OTA `oci.invite_offset` = **D-4 10:00**. Nhắc `oci.nudge_offset` = **D-2 10:00**, chỉ khi lời mời đã gửi ≥ 24 giờ. Đặt trước < 3 ngày (`oci.min_lead_days_for_nudge`) → không nhắc riêng, gộp vào TP-03 |
| Hạn | Hạn mềm `oci.soft_deadline` = **12:00 ngày D** (để lễ tân đối chiếu trước giờ nhận 14:00). Khách đến sau 22:00: hạn `oci.late_arrival_deadline` = **20:00 ngày D** (đối chiếu trong giờ trực – SR-GST-15). Quá hạn: làm thủ tục tại quầy như thường, **không phạt** |
| Kênh | Trực tiếp: Zalo/email/WhatsApp. Booking.com: hội thoại + link được phép. Agoda: CMS nếu bật. **Airbnb: không gửi link** (mục 5) |
| Nội dung | Lợi ích ("nhận phòng chỉ vài phút"), ~2 phút, cần hộ chiếu/CCCD của **mọi người** ở (BR-601), trẻ em dùng số định danh (BR-612), hạn hoàn tất, **lý do pháp lý** (khai báo lưu trú theo luật Việt Nam), cam kết bảo mật ngắn. Không xin ảnh giấy tờ qua chat |
| Loại | VH (P02 – nghĩa vụ luật) |
| Giọng | Giải thích, không ép. Không dùng "bắt buộc" ở câu đầu |
| Không phản hồi | Hết hạn mềm vẫn chưa làm → **không** nhắc thêm. Đơn vào danh sách "Chưa check-in online" trên Desk ngày D để lễ tân chuẩn bị nhận tại quầy. Khách đến sau 22:00 chưa làm → báo người trực đêm (BR-611) |
| Mẫu | `msg.checkin_link` (có). Mới: `msg.oci_nudge` |

### TP-03 · Nhắc trước 1 ngày
| Mục | Nội dung |
|---|---|
| Kích hoạt | Đơn `confirmed`, ngày đến = mai |
| Thời điểm | `pre_arrival.offset` = **D-1 10:00**. Hạn gửi: 20:59 D-1; quá hạn thì bỏ, gộp nội dung cần thiết vào TP-04 |
| Kênh | Theo mục 3 |
| Nội dung | ~~Giờ nhận phòng 14:00~~ **(cập nhật PO 26/10 theo BR v0.4.6, FB-INV-004)** Câu chuẩn BR-401 (e): "Nhận phòng từ {checkin_time} (phòng luôn sẵn sàng lúc 14:00) · Trả phòng trước {checkout_time}" – không viết "sẵn sàng từ 12:00"; nhận **trước 12:00** có phụ thu theo bậc (BR-411) nếu khách muốn đến sớm – **hỏi trước để xếp buồng**; **địa chỉ + link bản đồ** (`property.address`, `property.map_url`); **đỗ xe** (`property.parking_info` [GĐ – INV gửi]); đường từ sân bay Liên Khương (~45 phút – BL 3.21); **hỏi giờ đến dự kiến** (một nút); link check-in online + hạn nếu chưa làm; nội quy chính + phí (BR-511: hút thuốc 500.000, thẻ phòng 200.000/thẻ) dạng link; số liên hệ; gợi ý mang áo ấm (Đà Lạt về đêm lạnh) [GĐ – UXD viết]. Khách đến sau 22:00: nói rõ người trực đêm có mặt (ESC-010 T-A) |
| Loại | VH |
| Giọng | Chu đáo, thực tế, như chủ nhà nhắn khách sắp tới |
| Không phản hồi | Cần trả lời: **giờ đến**. Chưa có giờ đến lúc `eta.followup_time` = **12:00 ngày D** → việc "Hỏi giờ đến" cho lễ tân (nhắn hoặc gọi). 18:00 vẫn chưa đến và chưa có giờ → quy trình no-show BR-311 |
| Mẫu | Mới: `msg.pre_arrival` |

### TP-04 · Ngày đến
| Mục | Nội dung |
|---|---|
| Kích hoạt | Ngày D, **chỉ khi có nội dung mới**: (a) khách xin nhận sớm và buồng đã sẵn sàng; (b) khách đến sau 22:00; (c) đường vào Đà Lạt có sự cố (quản lý bật cờ, ví dụ đèo đóng – liên quan bất khả kháng BR-309); (d) chưa có giờ đến |
| Thời điểm | `arrival_day.offset` = **D 09:00**; (a) gửi ngay khi buồng `VI` |
| Kênh | Theo mục 3 |
| Nội dung | (a) "Căn đã sẵn sàng, bạn có thể nhận từ bây giờ, phí nhận sớm theo BR-411 là …"; (b) cách vào cơ sở khi khuya; mã cửa **chỉ** qua app mức 2 hoặc mẫu `door_code` đúng ngày đến, tin riêng, không kèm địa chỉ/số căn (SR-LOCK-03 – R3); (c) đường thay thế, số điện thoại; (d) hỏi giờ đến |
| Loại | VH |
| Giọng | Ngắn, đúng việc |
| Không phản hồi | Như TP-03. Khách báo đến trễ → giữ phòng cả đêm (BR-311) |
| Mẫu | Mới: `msg.arrival_day`, `msg.early_room_ready`, `msg.road_notice`. Có: `door_code` (SEC) |

### TP-05 · Chào sau nhận phòng (đêm đầu)
| Mục | Nội dung |
|---|---|
| Kích hoạt | Đơn chuyển `in_house` |
| Thời điểm | `welcome.delay_minutes` = **60 phút** sau nhận phòng thực tế. Nhận sau 21:00 → gửi 08:00 sáng sau (nội quy đã có trên app khách và thẻ trong phòng) |
| Kênh | Theo mục 3 |
| Nội dung | "Mọi thứ ổn chứ?"; **Wi-Fi** (tên mạng; mật khẩu trên trang `g.` và thẻ trong phòng – US-108); **nội quy + phí phạt** (BR-511) bằng ngôn ngữ của khách, có mã phiên bản; giờ trả phòng; cách gửi yêu cầu (dọn thêm, khăn, báo hỏng – BR-811); số khẩn ngoài giờ |
| Loại | VH |
| Giọng | Ấm, ngắn. Không liệt kê dài – nội quy để link |
| Bằng chứng | Tin này (`message_log` = `sent`, kèm phiên bản nội quy + ngôn ngữ) là **bằng chứng "nội quy đã gửi"** để thu phí BR-511 (đề xuất BR-977) |
| Không phản hồi | Không cần trả lời. Khách trả lời có vấn đề → tạo yêu cầu theo BR-811 |
| Mẫu | Mới: `msg.welcome`. Có: `msg.house_rules_smoking` (nhắc riêng khi cần) |

### TP-06 · Hỏi thăm giữa kỳ (ngắn ngày) / hằng tuần (dài hạn)
| Mục | Nội dung |
|---|---|
| Kích hoạt | Ngắn ngày: đơn `in_house` ≥ 3 đêm. Dài hạn: HĐ đang ở |
| Thời điểm | Ngắn ngày `midstay.offset` = **10:00 ngày thứ 2 lưu trú** (BL 5.18 bước 1); đơn 1–2 đêm không gửi (TP-05 đã hỏi). Dài hạn `long_stay.checkin_interval_days` = **7**, lần đầu D+2, 10:00. Khách được chọn "14 ngày" hoặc "tắt" |
| Kênh | Theo mục 3; dài hạn ưu tiên hội thoại 1-1 đang dùng |
| Nội dung | Ngắn ngày: "Mọi thứ ổn chứ?" + nút báo vấn đề. Dài hạn: hỏi thăm + lịch dọn tuần tới (nếu có gói – BR-204, US-056) + nhắc gửi yêu cầu qua app; **gộp** vào cùng tin nếu tuần đó có tin kỳ thu/điện nước |
| Loại | VH (DRA P07 ghi rõ "Mọi thứ ổn chứ?" trong lưu trú là P04) |
| Giọng | Quan tâm, không bán hàng. Không kèm ưu đãi |
| Không phản hồi | Không cần trả lời. Khách báo chưa hài lòng → lễ tân xử lý trong 10 phút giờ trực (BR-811), ghi "khiếu nại mở" (dùng cho TP-09). Dài hạn 3 tuần liền không trả lời → quản lý ghé hỏi trực tiếp khi gặp [GĐ] |
| Mẫu | Mới: `msg.midstay_check`, `msg.long_stay_weekly` |

### TP-07 · Nhắc trả phòng (US-034, BR-425)
| Mục | Nội dung |
|---|---|
| Kích hoạt | Đơn `in_house`, ngày đi = mai/hôm nay. Bỏ nếu khách đã chọn trên app |
| Thời điểm | Giữ nguyên `checkout_reminders` (BR-425): **R-1 20:00** (lần 1) · **R 09:00** (lần 2) · 11:00 chưa trả lời → lễ tân gọi · quá giờ: 12:00 nếu căn có khách đến hôm nay, 12:31 nếu không. Dài hạn: R-7 và R-1 (TP-14) |
| Kênh | Theo mục 3. Lần 1 có thể gộp với TP-06 nếu cùng ngày (≤ 2 tin/ngày) |
| Nội dung | Giờ trả 12:00; 3 nút: Trả đúng giờ / Ở thêm (giá theo BR-421, chỉ khi căn trống) / Trả muộn (bậc BR-412, ân hạn 12:30 khi căn không có khách đến); nhắc **trả đủ thẻ** (BR-511); xem trước bill (US-111, R3); trả phòng nhanh qua app khi đã thanh toán đủ (BR-427, US-138); đặt xe sân bay báo trước 1 giờ |
| Loại | VH |
| Giọng | Nhẹ, không giục. Ở thêm là gợi ý, không phải bán ép |
| Không phản hồi | Theo mốc BR-425 ở trên. 12:00/12:31 vẫn chưa trả → báo đỏ lễ tân + quản lý; buồng phòng gõ cửa cùng lễ tân (không vào khi khách chưa đồng ý) |
| Mẫu | `msg.checkout_reminder` (có). Mới: `msg.checkout_reminder_2` (lần 2, ngắn hơn) |

### TP-08 · Cảm ơn + bill
| Mục | Nội dung |
|---|---|
| Kích hoạt | Đơn `checked_out` |
| Thời điểm | `post_stay.thanks_delay_minutes` = **30 phút** sau trả phòng (khách đã rời quầy). Trả phòng nhanh qua app (BR-427) → bill tạm gửi ngay |
| Kênh | Trực tiếp: Zalo/email. OTA: hội thoại OTA (Booking.com cho nhắn đến 7 ngày sau trả phòng – [Nguồn – qua tìm kiếm]); bill PDF qua email nếu khách cần hóa đơn |
| Nội dung | Cảm ơn; số bill + tổng + link xem bill (BR-007, US-040); khoản phát sinh sau trả phòng nếu có trong 24 giờ (BR-427 c); hóa đơn điện tử sẽ gửi khi phát hành (BR-524); đồ để quên → liên hệ |
| Loại | VH (P03). Khối mã đặt trực tiếp (TP-10) là MKT – xem TP-10 |
| Giọng | Ấm, ngắn |
| Không phản hồi | Không cần trả lời |
| Mẫu | `msg.bill` (có). Mới: `msg.thanks_ota` (không bill, không mã) |

### TP-09 · Mời đánh giá
| Mục | Nội dung |
|---|---|
| Kích hoạt | Khách **trực tiếp/CTV**, đơn `checked_out`, đồng ý P07 = `granted` (hoặc luật sư cho gộp với P06) |
| Thời điểm | `post_stay.review_invite` = **R+1 10:00** (BL 5.18 bước 3). Đơn có **khiếu nại mở** → **hoãn** đến khi đóng, rồi vẫn gửi (không bỏ – xem dưới) |
| Kênh | Zalo/email. Link Google Maps của OTTIMO. Có OA: có thể dùng mẫu "đánh giá dịch vụ" 1–5 sao của ZBS để thu ý kiến nội bộ [Nguồn] |
| Nội dung | Một câu cảm ơn, một nút "Viết đánh giá". **Không** kèm mã giảm, quà, điều kiện. Không gợi ý số sao hay nội dung |
| Loại | ĐG – cần đồng ý |
| Giọng | Khiêm tốn, không ép |
| Ràng buộc | Google cấm chỉ mời khách hài lòng ("lọc đánh giá") và cấm ưu đãi để đổi đánh giá [Nguồn – qua tìm kiếm]. Vì vậy: mời **mọi** khách đã đồng ý; khiếu nại chỉ làm **hoãn**, không loại |
| Khách OTA | **Không gửi**. OTA tự mời đánh giá. Quản lý trả lời mọi đánh giá trong 24 giờ (BL 5.18 bước 4) |
| Không phản hồi | Không nhắc lại |
| Mẫu | Mới: `msg.review_invite` |

### TP-10 · Mã đặt trực tiếp (mã khách quay lại)
| Mục | Nội dung |
|---|---|
| Kích hoạt | Khách kênh **Trực tiếp hoặc CTV** (BR-111), đồng ý P06 = `granted` **của chính người nhận** (BR-955) |
| Thời điểm | Cùng lúc TP-08, nhưng là **khối/tin riêng**: (a) in ở chân bill của đơn trực tiếp (BL 3.8); (b) email cảm ơn có khối ưu đãi + link từ chối; (c) Zalo: **không** đưa vào tin mẫu ZBS giao dịch (không cho quảng cáo [Bên thứ ba]); chỉ gửi qua chat OA hoặc mẫu "voucher" nếu Zalo cho [Chưa xác minh điều kiện mẫu voucher] |
| Kênh | Như trên. Giờ gửi MKT `guest_msg.marketing_window` = [08:00, 20:00) |
| Nội dung | Mã `return_guest_code` (OTTIMO-BACK5, −5%, BR-111 [GĐ]), không cộng dồn với giảm theo đêm (BR-107), hạn dùng `return_code.validity_months` = 12 [GĐ], cách đặt (landing page, Zalo OA), link từ chối nhận tin |
| Loại | MKT – cần đồng ý từng người; người đi cùng tự đồng ý (BR-955) |
| Khách OTA | **Không bao giờ** – kể cả trên bill, thẻ trong phòng (mục 5) |
| Khách CTV quay lại tự đặt | Nguồn đơn `returning` (BR-112). Có tính hoa hồng CTV không → câu hỏi cho PO/INV (mục 11) |
| Tần suất | `guest_msg.marketing_max_per_30_days` = **2**/người [GĐ] – chặt hơn mức trần 3 tin/24 giờ của NĐ 91/2020 cho tin nhắn/email quảng cáo [Bên thứ ba – trích văn bản]. NĐ 91 có áp cho Zalo OA không: PHÁP LÝ |
| Mẫu | Mới: `msg.return_code` |

### TP-11 · Dài hạn – nhắc kỳ thu tiền thuê (BR-207)
| Mục | Nội dung |
|---|---|
| Kích hoạt | Kỳ thu `scheduled`/`due` của HĐ |
| Thời điểm | `rent_reminder_days` = **7** (có sẵn) → 10:00 hạn − 7; **09:00 ngày hạn** (`rent.due_day_reminder_time`); quá hạn 1 ngày → nhắc nhẹ 10:00 (`rent.overdue_guest_nudge_days` = 1); quá hạn 3 ngày → cảnh báo đỏ quản lý (BR-207, nội bộ); quá hạn 10 ngày → quản lý xử lý theo HĐ |
| Kênh | Hội thoại 1-1 của khách; email kèm chi tiết |
| Nội dung | Kỳ, số tiền (tiền thuê + phí dịch vụ – BR-207), hạn, VietQR đúng số tiền + nội dung chuyển khoản = mã kỳ (BR-521), cách trả khác (tiền mặt tại quầy). Số tiền chỉ gửi cho **chính người thuê** (SR-MSG-02) |
| Loại | VH |
| Giọng | Rõ ràng, tôn trọng, không đe dọa. **Không** nhắc khóa cửa – app không tự khóa cửa vì nợ (BR-207) |
| Không phản hồi | Ngày hạn chưa trả, chưa trả lời → việc "Gọi khách về kỳ thu" cho lễ tân/sale phụ trách hạn + 1 ngày. Hạn + 3 ngày → quản lý gọi. Khách hẹn ngày trả → ghi hẹn, dừng nhắc tự động đến ngày hẹn |
| Mẫu | Mới: `msg.rent_due`, `msg.rent_overdue_soft` |

### TP-12 · Dài hạn – hóa đơn điện nước tháng (BR-501…504)
| Mục | Nội dung |
|---|---|
| Kích hoạt | Chốt công tơ xong (BR-502: cuối tháng ± 2 ngày), qua kiểm bất thường (BR-503) |
| Thời điểm | Khi chốt xong, trong khung giờ; nhắc 09:00 ngày hạn nếu chưa trả (`utility_bill_due_days` = 5, có sẵn) |
| Kênh | Hội thoại 1-1 + app khách (R3) |
| Nội dung | Kỳ, kWh, m³, đơn giá (BR-501), tổng, hạn, ảnh công tơ trên app, VietQR |
| Loại | VH |
| Giọng | Minh bạch – khách dài hạn sợ phí ẩn (journeys P6) |
| Không phản hồi | Như TP-11, chỉ một lần nhắc ngày hạn; sau đó việc cho lễ tân |
| Mẫu | `msg.utility_bill` (có) |

### TP-13 · Dài hạn – chào gia hạn HĐ và nhắc thị thực
| Mục | Nội dung |
|---|---|
| Kích hoạt | (a) HĐ hết hạn trong `lease_renewal_offer_days` = 30 (BR-211, có sẵn); (b) thị thực/tạm trú hết trong `visa_expiry_warning_days.long_stay` = 30 (BR-605, có sẵn) |
| Thời điểm | (a) HĐ hết − 30, 10:00; chưa trả lời → hết − 21 (`lease_renewal.followup_days`); hết − 14 → sale/quản lý gọi. (b) Thị thực hết − 30, 10:00; một lần |
| Kênh | Hội thoại 1-1; sale phụ trách gửi tay (đây là trao đổi bán hàng, cần người) – app chỉ nhắc việc + soạn sẵn |
| Nội dung | (a) Ngày hết HĐ, "bạn muốn ở tiếp không?", giá gia hạn tính **tại thời điểm gia hạn** (BR-211) – sale báo riêng; (b) "giấy tờ lưu trú của bạn sắp hết hạn – cần hỗ trợ gia hạn không?" – **không** ghi số giấy tờ, loại thị thực, ngày cụ thể trong tin |
| Loại | VH (thực hiện HĐ). Không kèm ưu đãi khác |
| Giọng | Mời, không ép |
| Không phản hồi | Hết − 14 vẫn chưa quyết → quản lý quyết **có mở bán căn từ ngày hết HĐ không** (`lease_renewal.decision_days` = 14 [GĐ]), báo khách trước khi mở bán. Thị thực: hết − 14 chưa gia hạn → cảnh báo đỏ (BR-605) |
| Ví dụ | Emma, HĐ hết 4/12: chào 4/11, nhắc 13/11, gọi 20/11. Thị thực hết 20/11 → nhắc 21/10 10:00 |
| Mẫu | Mới: `msg.lease_renewal`, `msg.visa_reminder` |

### TP-14 · Dài hạn – trả phòng cuối HĐ (BR-425 dài hạn, BR-214)
| Mục | Nội dung |
|---|---|
| Kích hoạt | HĐ không gia hạn, ngày trả = R |
| Thời điểm | `long_stay.checkout_reminder_days` = **[7, 1]**, 10:00 |
| Kênh | Hội thoại 1-1 |
| Nội dung | R-7: hẹn giờ kiểm phòng (biên bản có ảnh – BR-214), chốt công tơ ngày trả (BR-502), trả đủ thẻ (BR-511), thời hạn hoàn ký quỹ **7 ngày làm việc** (BR-214), tài khoản nhận hoàn. R-1: giờ trả 12:00, miễn trả muộn đến 15:00 nếu căn không có khách đến (BR-413) |
| Loại | VH |
| Giọng | Cảm ơn thời gian ở cùng, rõ từng bước tiền |
| Không phản hồi | R-3 chưa hẹn giờ kiểm phòng → việc cho lễ tân gọi |
| Mẫu | Mới: `msg.lease_end_7d`, `msg.lease_end_1d` |

### TP-15 · Tin theo sự kiện
| Sự kiện | Khi gửi | Nội dung chính | Loại | Ai gửi | Không phản hồi |
|---|---|---|---|---|---|
| Đơn đổi ngày/căn/số người | Ngay sau khi lưu (BR-429) | Thông tin mới, chênh lệch tiền nếu có | VH | Tự động/lễ tân | – |
| Hủy đơn | Ngay sau khi hủy | Xác nhận hủy, số tiền hoàn/giữ (BR-309), thời hạn hoàn (BR-522) | VH | Tự động | – |
| Dời căn do xung đột/overbooking (BR-312, BR-317) | **Trước khi khách lên đường**; ngày đến ≤ 24 giờ: trong 1 giờ | Lời xin lỗi, phương án, chi phí OTTIMO chịu | VH | **Quản lý gọi trước**, tin xác nhận sau | Không liên lạc được → gọi lại mỗi 30 phút, kênh thứ hai |
| Sự cố (nước nóng, mất điện – BR-964) | Ngay, **bỏ qua giờ yên tĩnh** | Đã nhận, giờ xử lý dự kiến; cập nhật mỗi `incident.update_interval_minutes` = 60 [GĐ] đến khi xong | VH | Lễ tân/người trực | – |
| Bảo trì có vào phòng | 24 giờ trước | Ngày giờ, việc, thời lượng | VH | Lễ tân | Khách không đồng ý giờ → hẹn lại |
| Đồ để quên (BR-513) | Trong 24 giờ | Mô tả đồ, cách nhận/gửi, giữ 30 ngày | VH | Lễ tân | Sau 7 ngày nhắn lại 1 lần [GĐ] |
| Hoàn tiền xong (BR-522) | Khi chi | Số tiền, cách nhận | VH | Tự động | – |
| Khách nhắn ngoài giờ trực | Ngay | Trả lời tự động: giờ xử lý + số khẩn (BR-811) | VH | Tự động | Lễ tân trả lời đầu ca |

---

## 7. Đề xuất BR mới (dự thảo – **chưa** đưa vào `business-rules.md`)

> Đề xuất nhóm mới **12B – Giao tiếp với khách (BR-971…BR-983)**, nằm sau nhóm 12A (BR-961…964). Số là dự thảo; DOM đưa vào `business-rules.md` sau khi PO + BA review và INV quyết ESC ở mục 9.

| Mã (dự thảo) | Quy tắc | Ví dụ | Nhãn |
|---|---|---|---|
| BR-971 | **Phân loại tin**: Vận hành (P01/P03/P04) · Đánh giá (P07) · Marketing (P06). Vận hành không cần ô đồng ý riêng. Đánh giá và marketing chỉ gửi khi đồng ý của **chính người nhận** = `granted` (BR-955); mỗi tin marketing có cách từ chối; rút đồng ý có hiệu lực ngay với tin chưa gửi. Một tin không trộn hai loại | Anh Hưng đồng ý ưu đãi, vợ anh chưa trả lời → chỉ anh nhận mã giảm; cả hai vẫn nhận tin vận hành nếu có liên hệ | Cách phân loại: NGÀNH; cần đồng ý cho P07: PHÁP LÝ (luật sư – ESC-001) |
| BR-972 | **Chọn kênh** theo thứ tự: (1) kênh khách chọn trong hồ sơ; (2) đơn OTA → hội thoại OTA (Airbnb: chỉ Airbnb); (3) SĐT có Zalo → Zalo; (4) email; (5) WhatsApp/Telegram của cơ sở (gửi tay); (6) gọi điện. Một điểm chạm chỉ gửi **một** kênh; kênh khác chỉ dùng khi kênh trước gửi lỗi | Ji-woo (Booking.com, không có Zalo, email ẩn) → hội thoại Booking.com; email ẩn chỉ khi hội thoại lỗi | NGÀNH |
| BR-973 | **Giờ gửi** tin chủ động [07:00, 21:00) giờ cơ sở; marketing [08:00, 20:00). Ngoài khung → dời đến đầu khung kế tiếp. **Ngoại lệ**: trả lời khách; sự cố; tin do khách vừa thao tác (đặt, trả tiền, nhận/trả phòng); xác nhận đơn có ngày đến ≤ hôm sau; khách đến sau 22:00 trong ngày đến. Tin mẫu ZBS chỉ gửi được 06:00–22:00 [Bên thứ ba] → ngoài giờ đó dùng email/chat OA | Đơn đặt 22:40 ngày 20/10, đến 25/10 → xác nhận 07:00 ngày 21/10. Đơn đặt 22:40, đến 21/10 → xác nhận ngay qua email/chat OA | Khung giờ: [GĐ]; cơ chế: NGÀNH |
| BR-974 | **Trần số tin chủ động**: ≤ 2 tin/ngày/đơn (không tính trả lời, sự cố, tin do khách thao tác). Hai tin cùng ngày cách < 3 giờ → gộp làm một. Marketing ≤ 2 tin/30 ngày/người | D-1: nhắc check-in + tin D-1 cùng 10:00 → một tin. Ngày đi: nhắc lần 2 09:00 + cảm ơn 12:10 = 2 tin | [GĐ] |
| BR-975 | **Lịch chạm khách ngắn ngày** = bảng TP-00…TP-10 (mục 6), mọi mốc là tham số (mục 8). Đơn đặt sát ngày (đến hôm nay hoặc ngày mai) gộp TP-01 + TP-02 + TP-03. Đơn 1–2 đêm không có TP-06 | Ví dụ căn 202, 23–26/10 ở mục 4: 8–9 tin, không ngày nào quá 2 tin | Mốc giờ: [GĐ]; cấu trúc: NGÀNH |
| BR-976 | **Check-in online**: mời (trực tiếp: kèm xác nhận; OTA: D-4 10:00, trừ Airbnb), nhắc một lần D-2 10:00 nếu khai báo còn `none`; hạn mềm 12:00 ngày D; khách đến sau 22:00: hạn 20:00 ngày D. Quá hạn → làm tại quầy, không phạt. Không nhận ảnh giấy tờ qua chat (R-REG-08) | Khách đến 23:30 ngày 23/10 chưa làm xong lúc 20:00 → người trực đêm nhận tại quầy, khai báo theo BR-602/603 | Mốc: [GĐ]; không phạt: NGÀNH |
| BR-977 | **Bằng chứng nội quy cho phí phạt BR-511**: đạt khi có **một** trong: (a) tin TP-05 `sent` kèm phiên bản nội quy + ngôn ngữ; (b) khách xác nhận đã đọc nội quy trên app khách; (c) lễ tân tick "đã giao nội quy" khi nhận phòng; kèm nội quy trên mô tả OTA (BR-415). Không có bằng chứng → Desk **không tự gợi ý** phí phạt; quản lý quyết | Căn 203 có mùi thuốc lá, TP-05 gửi 15:10 23/10 bản nội quy v3 EN → thu 500.000 (BR-511). Không có (a)(b)(c) → quản lý quyết, thường miễn | NGÀNH |
| BR-978 | **Thông tin nhạy cảm trong tin**: Wi-Fi chỉ từ lúc nhận phòng; mã cửa theo SR-LOCK-03 (app mức 2 hoặc mẫu `door_code` đúng ngày đến, tin riêng, không kèm địa chỉ/số căn); không số/ảnh giấy tờ, không số thẻ; số tiền chỉ gửi cho chính người đặt/người thuê; không gửi vào nhóm chat nhiều khách | Tin D-1 có địa chỉ + bản đồ, không có số căn và mã cửa | NGÀNH (theo SEC) |
| BR-979 | **Không phản hồi và leo thang**: điểm chạm cần trả lời có hạn (giờ đến: 12:00 ngày D; trả phòng: 11:00 ngày R – BR-425; kỳ thu: hạn + 1 ngày; gia hạn HĐ: hết − 14). Quá hạn → việc cho lễ tân trên Desk ("Hôm nay"/"Cần chú ý"), lễ tân gọi điện hoặc dùng kênh thứ hai, **ghi kết quả liên lạc**. Hai lần không liên lạc được → báo quản lý | Chưa có giờ đến lúc 12:00 → việc "Hỏi giờ đến"; 16:00 gọi lần 2 không được → báo quản lý; 18:00 → BR-311 | Hạn: [GĐ]; cơ chế: NGÀNH |
| BR-980 | **Lịch tin gắn với đơn**: lịch tính lại khi đổi ngày/căn; hủy hết tin chờ khi đơn `cancelled`/`no_show`/`checked_out` (trừ tin sau trả phòng). Mỗi tin có **hạn gửi**; quá hạn (mất mạng, hàng đợi kẹt) thì **bỏ**, tạo việc cho lễ tân. Không gửi tin của đơn cũ sau khi đơn đã đổi | Mất mạng 08:30–11:30 ngày trả phòng → tin 09:00 không gửi lúc 11:30; thay bằng lễ tân gọi theo mốc 11:00 | NGÀNH |
| BR-981 | **Đơn OTA**: chỉ tin vận hành, trong hội thoại OTA; không chào đặt ngoài OTA, không mã giảm (kể cả trên bill, thẻ trong phòng); Airbnb không link; Booking.com chỉ link trong danh sách được phép; không dùng email ẩn của OTA ngoài thời gian lưu trú; chuyển kênh chỉ khi khách đề nghị sau khi đặt | Đơn Airbnb căn 401: tin D-1 bằng chữ, không link; bill không in OTTIMO-BACK5 | NGÀNH (theo chính sách OTA – mục 5); Booking, Agoda, Expedia, Trip.com, Traveloka: [Chưa xác minh chi tiết] |
| BR-982 | **Lịch chạm khách dài hạn**: hỏi thăm mỗi 7 ngày (khách chọn 14 hoặc tắt); kỳ thu hạn − 7 và ngày hạn (BR-207); điện nước khi chốt (BR-504); gia hạn hết − 30/−21/−14 (BR-211); thị thực hết − 30 (BR-605); trả phòng R-7, R-1. Gộp tin cùng tuần. Không nhắc khóa cửa vì nợ | Daniel (301), kỳ thu 1/11/2026: nhắc 25/10 10:00, 1/11 09:00, chưa trả → 2/11 10:00 nhắc nhẹ, 4/11 cảnh báo đỏ quản lý (BR-207), 11/11 quản lý xử lý theo HĐ | Mốc kỳ thu: có sẵn BR-207 [GĐ]; còn lại: [GĐ] |
| BR-983 | **Sau lưu trú**: cảm ơn + bill (vận hành) 30 phút sau trả phòng; mời đánh giá R+1 10:00 cho **mọi** khách trực tiếp/CTV đã đồng ý – khiếu nại mở chỉ **hoãn** đến khi đóng; **không** kèm ưu đãi trong lời mời đánh giá; mã đặt trực tiếp là tin/khối marketing riêng (BR-971, BR-111) | Huy trả phòng 11:40 ngày 26/10 → cảm ơn 12:10; mời đánh giá 27/10 10:00. Khách báo "nước nóng yếu", phiếu đóng 28/10 → mời 29/10 10:00 | NGÀNH (theo chính sách Google – [Nguồn – qua tìm kiếm]) |

---

## 8. Tham số đề xuất (bổ sung mục 13 `business-rules.md` khi chốt)

| Khóa (dự thảo) | Mặc định | BR | Trạng thái |
|---|---|---|---|
| `guest_msg.send_window` | [07:00, 21:00) | BR-973 | GĐ |
| `guest_msg.marketing_window` | [08:00, 20:00) | BR-973 | GĐ |
| `guest_msg.max_proactive_per_day` | 2 / đơn | BR-974 | GĐ |
| `guest_msg.merge_within_hours` | 3 | BR-974 | NGÀNH |
| `guest_msg.marketing_max_per_30_days` | 2 / người | BR-974 | GĐ |
| `guest_msg.channel_order` | khách chọn → hội thoại OTA → Zalo → email → WhatsApp/Telegram (tay) → gọi | BR-972 | NGÀNH |
| `booking_confirm.max_delay_minutes` | 15 (ngoài khung → 07:00, trừ ngày đến ≤ hôm sau) | BR-973, 975 | NGÀNH |
| `ota_welcome.within_hours` | 24 | BR-975 | NGÀNH |
| `oci.invite_offset` | OTA: D-4 10:00 · trực tiếp: kèm TP-01 | BR-976 | GĐ |
| `oci.nudge_offset` | D-2 10:00 (lời mời đã gửi ≥ 24 giờ) | BR-976 | GĐ |
| `oci.min_lead_days_for_nudge` | 3 | BR-976 | NGÀNH |
| `oci.soft_deadline` | 12:00 ngày D | BR-976 | GĐ |
| `oci.late_arrival_deadline` | 20:00 ngày D | BR-976 | GĐ (khớp SR-GST-15) |
| `pre_arrival.offset` | D-1 10:00 | BR-975 | GĐ |
| `eta.followup_time`, `eta.escalate_time` | 12:00 ngày D; 16:00 ngày D | BR-979 | GĐ |
| `arrival_day.offset` | D 09:00 (chỉ khi có nội dung) | BR-975 | GĐ |
| `welcome.delay_minutes`, `welcome.latest_time` | 60; 21:00 (sau đó → 08:00 hôm sau) | BR-975, 977 | GĐ |
| `midstay.offset`, `midstay.min_nights` | 10:00 ngày thứ 2; 3 đêm | BR-975 | GĐ |
| `long_stay.checkin_interval_days`, `long_stay.checkin_first_day` | 7 (khách chọn 14/tắt); D+2 | BR-982 | GĐ |
| `checkout_reminders` (có sẵn) | 20:00 R-1; 09:00; 11:00; 12:00/12:31 | BR-425 | GĐ (giữ) |
| `long_stay.checkout_reminder_days` | [7, 1], 10:00 | BR-982 | GĐ |
| `post_stay.thanks_delay_minutes` | 30 | BR-983 | NGÀNH |
| `post_stay.review_invite` | R+1 10:00; hoãn khi khiếu nại mở | BR-983 | GĐ |
| `return_code.validity_months` | 12 | BR-111 | GĐ |
| `rent.due_day_reminder_time` | 09:00 ngày hạn | BR-982 | GĐ |
| `rent.overdue_guest_nudge_days` | 1 | BR-982 | GĐ |
| `lease_renewal.followup_days` | [21, 14] | BR-982 | GĐ |
| `lease_renewal.decision_days` | 14 (quản lý quyết mở bán) | BR-982 | GĐ |
| `incident.update_interval_minutes` | 60 | TP-15 | GĐ |
| `lost_found.second_notice_days` | 7 | TP-15 | GĐ |
| `house_rules.version` (theo ngôn ngữ) | v1 VI/EN/RU | BR-977 | NGÀNH |
| `ota_messaging_policy.<channel>` | airbnb: `thread_only_no_links`; booking: `thread_links_allowlist`; agoda: `cms_if_enabled`; còn lại: `thread_only` | BR-981 | NGÀNH + [Chưa xác minh] |
| `property.address`, `property.map_url`, `property.parking_info` | INV cung cấp | TP-03 | GĐ – INV gửi (địa chỉ theo tên phường mới) |

Giữ nguyên (đã có): `rent_reminder_days` 7, `rent_overdue_alert_days` 3, `rent_overdue_escalate_days` 10, `lease_renewal_offer_days` 30, `visa_expiry_warning_days.long_stay` 30, `utility_bill_due_days` 5, `front_desk_hours` [07:00, 22:00), `guest_request_response_minutes` 10, `post_checkout_charge_hours` 24, `no_show_call_time` 18:00.

---

## 9. Dự thảo ESC (ORC cấp số – đề nghị gom cùng ESC landing page)

> DOM không tự cấp số để tránh trùng với ESC-020 (landing page, FB-INV-001) mà các vai khác đang soạn. Theo protocol mục 8: liên quan **tiền** (phí Zalo), **tài khoản bên thứ ba** (OA doanh nghiệp) và **đổi quyết định đã chốt** (ESC-010 B).

**ESC-0xx – Dùng Zalo OA để chăm sóc khách (mở lại phần Zalo của ESC-010) và mã đặt trực tiếp với khách OTA**
- Người tạo: DOM (INT, SEC góp ý) | Round: 2 | Mức khẩn: Bình thường (gom cuối round)
- Bối cảnh: Ngày 16/10 anh/chị chọn ESC-010 phương án B: Zalo ZNS để sau MVP, tin Zalo gửi tay. Ngày 17/10 anh/chị muốn dùng Zalo OA để chăm sóc khách. Zalo OA là tài khoản doanh nghiệp: khách nhắn 2 chiều với OTTIMO, và OTTIMO tự gửi được tin mẫu (xác nhận, nhắc ngày đến, nhắc trả phòng, bill) tới số điện thoại có Zalo. Mẫu tin phải được Zalo duyệt trước. Khách nước ngoài phần lớn không dùng Zalo – vẫn dùng email và hội thoại OTA.
- Câu hỏi cần quyết định: Anh/chị có mở Zalo OA doanh nghiệp và cho app tự gửi tin mẫu Zalo từ Round 3 không?
- Phương án:
  - **A (đầy đủ)**: OA đã xác thực theo tên CTCP UTMG Living. (1) Lễ tân trả lời khách trên OA thay Zalo cá nhân – ngay khi có OA. (2) App tự gửi 7 tin mẫu vận hành: xác nhận, mời/nhắc check-in online, nhắc D-1, chào nhận phòng, nhắc trả phòng, cảm ơn + bill, nhắc kỳ thu/điện nước – từ giữa Round 3 sau khi Zalo duyệt mẫu. (3) Tin ưu đãi qua OA chỉ với khách đã đồng ý – sau MVP. – Ưu: đúng mong muốn; lễ tân bớt 6–8 tin gửi tay mỗi lượt khách Việt; hội thoại không nằm trên điện thoại cá nhân. – Nhược: thêm một tài khoản phải quản lý; mẫu tin phải chờ Zalo duyệt. – Chi phí: tin mẫu 200–300 đ/tin chưa VAT [Nguồn: zalo.solutions/zns/pricing, tra 17/10/2026]; ước 150–250 tin/tháng → khoảng **30.000–75.000 đ/tháng** [ước tính DOM từ 46 đơn tháng 10 và 4–6 căn dài hạn]; phí gói OA nếu cần: [Chưa xác minh – bài viết bên thứ ba nêu 99.000–399.000 đ/tháng]. Ngoài ngân sách hạ tầng (Brief 7 #5). – Thời gian: anh/chị tạo + xác thực OA, mở tài khoản gửi tin mẫu, nạp tiền; đội nộp mẫu đầu Round 3.
  - **B (chỉ chat OA)**: dùng OA để nhắn 2 chiều; tin vẫn do lễ tân bấm sao chép từ danh sách "Tin cần gửi hôm nay" trên Desk. – Ưu: rẻ, không chờ duyệt mẫu. – Nhược: lễ tân vẫn gửi tay; quên vào giờ đông khách. – Chi phí: chỉ phí gói OA nếu có [Chưa xác minh].
  - **C (giữ ESC-010 B)**: Zalo của cơ sở, gửi tay như hiện nay. – Ưu: 0 đ. – Nhược: không đáp ứng mong muốn; khó bàn giao ca.
- Câu phụ 1 – **Mã đặt trực tiếp với khách OTA**:
  - M-A (đội đề xuất): không gửi qua bất kỳ kênh nào, không in trên bill đơn OTA, không in trên thẻ trong phòng. Khách OTA **tự** theo dõi OA hoặc **tự** đăng ký trên landing page, có đồng ý → từ đó mới nhận ưu đãi.
  - M-B: gửi mã cho mọi khách đã đồng ý tại quầy, kể cả khách OTA. – Rủi ro: Airbnb cấm rõ chào đặt ngoài nền tảng và giảm giá để đặt ngoài [Nguồn]; có thể bị phạt hoặc khóa listing.
- Câu phụ 2 – **Lịch chạm khách mặc định** (mục 4, 8): dùng làm mặc định, chỉnh được về sau? Đội đề xuất: đồng ý.
- Câu phụ 3 – **Khách nước ngoài**: email tự động (đã có) + WhatsApp của cơ sở gửi tay ở Round 3; WhatsApp tự động để sau MVP [Chưa xác minh chi phí]. Đội đề xuất: đồng ý.
- Đội đề xuất: **A**, làm theo 2 bước (chat OA trước, tin mẫu sau); **M-A**; đồng ý câu phụ 2 và 3.
- Nếu chưa quyết thì: Round 3 làm danh sách "Tin cần gửi hôm nay" + sao chép (không cần tài khoản); không bật gửi tự động Zalo; không gửi mã giảm cho khách OTA.
- Hạn cần trả lời: cuối Round 2 (để kịp mở OA và Zalo duyệt mẫu đầu Round 3).
- Tham chiếu cho đội: tài liệu này mục 3, 5, 6, 7; ESC-010; `integrations.md` I7, 3.4; SR-GST-13, SR-MSG-01/02; DRA P06, P07, P11.

**Đề nghị thêm vào danh sách câu hỏi luật sư (ESC-001), không mở ESC mới:**
1. NĐ 91/2020/NĐ-CP (tin nhắn, email quảng cáo: chỉ 07:00–22:00, ≤ 3 tin/24 giờ, phải được đồng ý [Bên thứ ba – trích văn bản]) có áp cho tin Zalo OA, WhatsApp không?
2. Mời đánh giá (P07) có gộp vào đồng ý marketing (P06) được không?
3. Gửi tin vận hành qua Zalo (VNG) và WhatsApp (Meta) có phải ghi vào danh sách bên xử lý dữ liệu và thông báo cho khách không (DRA P11)?

---

## 10. Việc cho các vai (gợi ý – ORC quyết giao)

| Vai | Việc |
|---|---|
| PO | Thêm story **"Lịch chạm khách + Tin cần gửi hôm nay"** (Desk sinh việc gửi tin theo lịch, sao chép một chạm, ghi `message_log` = `copied`) – đề xuất **Must R3 Sprint 1**: chạy được không cần tài khoản Zalo. Gắn US-034, US-116, US-125 (mở rộng ~20 mẫu), US-126 (bật tự gửi khi có OA), US-077 (đồng ý từng người), US-040 (bill đơn OTA không in mã). Landing page (EP18/ESC-020): nút "Theo dõi Zalo OA" + ô đồng ý nhận ưu đãi **không tích sẵn** |
| BA | Đặc tả máy trạng thái của một "tin theo lịch": `scheduled → due → sent/copied → skipped/expired/cancelled`; điều kiện bỏ qua từng TP; quyền: CTV không render link check-in (SR-MSG-03) |
| UXD | Viết câu chữ VI/EN/RU cho các mẫu mới ở mục 6 (giọng theo content-guide mục 1); bản dùng cho ZBS phải theo giới hạn mẫu Zalo (biến, không quảng cáo) |
| INT | Kiểm trên tài khoản thật: Zalo OA (điều kiện xác thực, phí gói, cửa sổ 48 giờ chat, giờ gửi 06:00–22:00, mẫu voucher), danh sách link được phép của Booking.com, Agoda CMS, Expedia/Trip.com/Traveloka; Beds24 `POST /bookings/messages` cho kênh nào |
| ARC/BE | Bảng lịch tin theo đơn (tính lại khi đơn đổi, hạn gửi, bỏ tin quá hạn – BR-980); kiểm đồng ý P06/P07 lúc gửi; `message_log` thêm `touchpoint_code`, `house_rules_version` (BR-977) |
| SEC | Tài khoản quản trị OA trên thiết bị của cơ sở; Zalo/Meta vào danh sách bên xử lý (DRA P11); rà BR-978 |
| DATA | Chỉ số: % khách check-in online trước khi đến; % khách có giờ đến trước 12:00 ngày D; tỉ lệ trả lời nhắc trả phòng; tỉ lệ đánh giá trên khách trực tiếp; tỉ lệ khách quay lại đặt trực tiếp |
| QA | Kịch bản ở mục 11 |

---

## 11. Tình huống khó cho QA (gắn BR dự thảo)

| # | Tình huống | Kết quả đúng |
|---|---|---|
| 1 | Khách đặt 22:40 cho đêm nay | Xác nhận gửi ngay qua email/chat OA (ZBS không gửi sau 22:00); gộp TP-01–03 (BR-973, 975) |
| 2 | Khách đổi ngày đến sau khi đã nhận tin D-1 | Hủy lịch cũ, tính lịch mới, gửi tin "đổi đơn" (BR-980, TP-15) |
| 3 | Đơn bị hủy lúc 09:55, tin D-1 hẹn 10:00 | Tin D-1 không gửi (BR-980) |
| 4 | Mất mạng 08:30–11:30 ngày trả phòng | Tin 09:00 bị bỏ, không gửi lúc 11:30; lễ tân gọi theo mốc 11:00 (BR-980, BR-425) |
| 5 | SĐT khách Việt không có Zalo | Chuyển email; không có email → việc gọi điện (BR-972) |
| 6 | Đơn Airbnb | Không có link, không mã giảm; bill không in mã (BR-981) |
| 7 | Đơn nhóm 3 căn | Tin gửi người đặt; nội quy in trong từng căn làm bằng chứng (BR-977) |
| 8 | Khách đến 01:30, chưa check-in online | Người trực đêm nhận tại quầy; hạn khai báo theo giờ đến thực tế (BR-602/603, BR-976) |
| 9 | Khách khiếu nại nước nóng ngày 2, phiếu đóng sau trả phòng | Mời đánh giá **sau** khi đóng phiếu, không bỏ (BR-983) |
| 10 | Khách rút đồng ý ưu đãi sau khi tin marketing đã lên lịch | Tin không gửi (BR-971) |
| 11 | Khách dài hạn hẹn trả tiền ngày 5 khi hạn ngày 1 | Ghi hẹn; dừng nhắc tự động đến ngày 5 (TP-11) |
| 12 | Đơn OTA dời sang cơ sở khác ngày đến (BR-312) | Quản lý gọi trước khi khách lên đường; tin xác nhận sau; không gửi tin D-1 của căn cũ (TP-15, BR-980) |
| 13 | Ngày đi có 3 tin (nhắc lần 2, gia hạn, cảm ơn) | Không quá 2 tin chủ động; tin do khách thao tác không tính (BR-974) |
| 14 | Mã cửa trong tin | Chỉ mẫu `door_code` đúng ngày đến, tin riêng, không địa chỉ/số căn (BR-978, SR-LOCK-03) |

---

## 12. Giả định, câu hỏi còn mở, điểm chưa xác minh

**Giả định đã dùng**
1. Khung giờ gửi 07:00–21:00 và các mốc 10:00/09:00/20:00 là mặc định hợp lý cho khu nghỉ dưỡng [GĐ]; khách nước ngoài phần lớn đã ở Việt Nam khi nhận tin D-1 [GĐ].
2. Ca tối có người trực tại cơ sở (ESC-010 T-A) → khách đến khuya không cần mã cửa qua tin nhắn ở MVP.
3. Ước tính số tin: 46 đơn ngắn ngày tháng 10 (BL 5.11), khoảng 14 đơn trực tiếp; 4–6 căn dài hạn; ~7 tin/lượt khách Việt; ~7 tin/tháng/khách dài hạn.
4. Tên miền gốc dành cho landing page; link khách dùng `g.<tên-miền>` (hosting-plan 5.1).
5. Mã OTTIMO-BACK5 và 5% vẫn là [GĐ] theo BR-111.

**Câu hỏi còn mở (PO/INV, không chặn việc)**
- Khách do CTV giới thiệu, lần sau tự đặt trực tiếp: CTV có được hoa hồng không? (BR-112 `returning`, BR-903) – PO gom vào ESC chính sách khi cần.
- Chỗ đỗ ô tô/xe máy của OTTIMO (đánh giá mẫu có 5% phàn nàn đỗ xe – BL 3.20) – INV gửi `property.parking_info`.
- Địa chỉ chính thức theo tên phường mới – INV gửi.

**Chưa xác minh** (INT kiểm trên tài khoản thật trước khi code R3)
- Zalo OA: điều kiện xác thực doanh nghiệp, phí gói OA, cửa sổ 48 giờ cho tin chat [Bên thứ ba], giờ gửi tin mẫu 06:00–22:00 [Bên thứ ba], tin mẫu không được có nội dung quảng cáo [Bên thứ ba], điều kiện dùng mẫu voucher.
- Từ 01/01/2026 Zalo gộp tin giao dịch/truyền thông theo UID và ZNS thành "ZBS Template Message" [Nguồn – qua tìm kiếm; trang thông báo không mở được nội dung].
- Booking.com: danh sách link được phép, thời hạn nhắn 7 ngày sau trả phòng, lời mời check-in 48 giờ của Booking.com [Nguồn – qua tìm kiếm].
- Agoda, Expedia, Trip.com, Traveloka: quy định link và marketing.
- WhatsApp: mức phí và chính sách hiện hành khi dùng API.

---

## 13. Nguồn (tra ngày 17/10/2026)

| # | Nội dung dùng | Link | Mức |
|---|---|---|---|
| 1 | Airbnb: cấm link ra ngoài, cấm chào đặt/giảm giá ngoài nền tảng, cấm dùng liên hệ khách để marketing; được đổi kênh khi khách đề nghị sau khi đặt; được yêu cầu giấy tờ khi luật bắt buộc | https://www.airbnb.com/help/article/2799 | [Nguồn] |
| 2 | Booking.com: danh sách link được phép trong tin nhắn | https://partner.booking.com/en-us/help/legal-security/security/all-about-our-messaging-security-settings | [Nguồn – qua tìm kiếm] (403) |
| 3 | Booking.com: liên hệ khách, thời hạn nhắn | https://partner.booking.com/en-gb/help/reservations/contact-extranet/contacting-your-guests | [Nguồn – qua tìm kiếm] (403) |
| 4 | Booking.com: check-in online của Booking.com 48 giờ trước | https://partner.booking.com/en-us/help/channel-manager/bookings/online-check-faqs | [Nguồn – qua tìm kiếm] |
| 5 | Zalo: giá tin mẫu ZBS (200/300 đ, chưa VAT; nút thứ 2 trở đi 100 đ) | https://zalo.solutions/zns/pricing | [Nguồn] |
| 6 | Zalo: 4 loại mẫu ZNS (bảng, văn bản, xác thực, đánh giá dịch vụ 1–5 sao) | https://zalo.solutions/blog/phan-biet-4-loai-mau-thong-bao-zns-zns-template-api/qbua967pjgmwgn89z | [Nguồn] |
| 7 | Zalo: ZBS Template Message từ 01/01/2026 | https://developers.zalo.me/changelog/thong-bao-ra-mat-zbs-template-message-va-lo-trinh-chuyen-doi-7814 | [Nguồn – qua tìm kiếm] |
| 8 | ZBS chỉ gửi 06:00–22:00 (trừ OTP); SĐT phải có Zalo | https://apidocs.nhanh.vn/v3/zalo/zbs | [Bên thứ ba] |
| 9 | ZNS: cần khách đồng ý + SĐT; không nội dung quảng cáo; một tin mỗi giao dịch | https://www.infobip.com/docs/zalo/compliance-guidelines | [Bên thứ ba] |
| 10 | Zalo OA: tin tư vấn chỉ trong 48 giờ sau tương tác | https://unpkg.com/@warriorteam/redai-zalo-sdk@1.11.1/docs/MESSAGE_SERVICES.md | [Bên thứ ba] |
| 11 | Zalo OA: phí gói (số liệu lệch giữa các nguồn) | https://viettelstore.vn/tin-tuc/zalo-oa-co-mat-phi-khong | [Bên thứ ba] |
| 12 | WhatsApp: cửa sổ 24 giờ, tin mẫu, cần đồng ý trước | https://business.whatsapp.com/policy ; https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing | [Nguồn – qua tìm kiếm] |
| 13 | NĐ 91/2020/NĐ-CP Điều 13: giờ gửi 07:00–22:00, ≤ 3 tin/email quảng cáo trong 24 giờ | https://hethongphapluat.com/nghi-dinh-91-2020-nd-cp-ve-chong-tin-nhan-rac-thu-dien-tu-rac-cuoc-goi-rac/dieu-13 | [Bên thứ ba – trích văn bản]; PHÁP LÝ |
| 14 | Google: cấm lọc đánh giá và cấm ưu đãi đổi đánh giá | https://support.google.com/contributionpolicy/answer/7400114 | [Nguồn – qua tìm kiếm] |
| 15 | OTA và marketing khách (Booking.com email ẩn, Expedia) | https://www.hospitalitynet.org/opinion/4134098/the-email-you-want-is-the-one-she-gives-you-for-a-reason | [Bên thứ ba] |

---

## 14. Lịch sử
| Ngày | Phiên bản | Thay đổi | Người |
|---|---|---|---|
| 17/10/2026 | 0.1 | Bản đầu: 16 điểm chạm, ma trận kênh, quy tắc OTA, 13 BR dự thảo (BR-971…983), ~30 tham số, dự thảo ESC Zalo OA | DOM |
