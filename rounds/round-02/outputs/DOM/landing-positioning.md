# Định vị nội dung landing + quy tắc yêu cầu đặt phòng từ website – DOM

- Người viết: DOM | Round 2 – Sprint 4, luồng **LP-v1** (ESC-020, ADR-014, EP19) | Ngày: 17/10/2026 | Bước: Sản xuất (trả lời FB-INV-002)
- Đầu vào: `04-investor-feedback/FB-INV-002.md` (nguyên văn 5 ý); `00-brief/context/brand/brand-guidelines.md`; `00-brief/context/landing/ebrochure-text.md`; `product/design/landing/concept.md` v1.1; `product/docs/adr/ADR-014-landing-site.md`; `rounds/round-02/outputs/PO/landing-scope.md`; `02-escalations/ESC-020.md`; `rounds/round-02/reviews/landing-zalo-SEC.md`; backlog EP19 (US-146…160); `product/docs/integrations/zalo-oa.md` mục 1; `product/docs/business-rules.md` v0.3.6.
- Đầu ra: file này · `product/docs/business-rules.md` **v0.3.7** (BR-112 sửa, BR-907 bổ sung, **nhóm 11A BR-911…916 mới**, 23 khóa tham số, mục 14, 15, 17, 18) · `product/tests/fixtures/br-examples.json` (thêm BR-112-02, BR-911-01, BR-912-01, BR-913-01…03, BR-914-01, BR-915-01, BR-916-01).
- Người review đề nghị: **UXD** (mục 1–4, 6.5, 7 – viết lại nội dung v1.2), **PO** (mục 5, 8 – AC US-151, US-155), **BA** (mục 5 – máy trạng thái `booking_inquiry`), **ARC/SEC** (mục 6.4, 6.6).
- Con số nghiệp vụ trong file này chỉ để minh họa; **giá trị chính thức nằm ở BR và mục 13 của `business-rules.md`** (nguyên tắc nguồn sự thật duy nhất).

---

## 0. Tóm tắt

1. **Một câu định vị:** OTTIMO là **boutique stay** – sự chăm chút của một khách sạn nhỏ, trong những căn phòng có bếp, máy giặt sấy và bàn làm việc riêng. Khách ở hai đêm thấy dư dả; khách ở hai tháng thấy vừa vặn.
2. **Thứ tự kể:** *Dẫn bằng kỳ nghỉ → chứng minh bằng căn phòng → chốt bằng độ dài ở.* Không mở đầu bằng "căn hộ" hay "thuê tháng"; không chê khách sạn.
3. E-brochure đang đẩy khách hiểu OTTIMO là **căn hộ dịch vụ cho thuê dài** (6 câu cụ thể ở mục 1.3) – landing **không** dùng lại các câu đó.
4. **Không nhắc số phòng** ở bất kỳ chữ nào khách hoặc máy tìm kiếm đọc được (kể cả JSON-LD `numberOfRooms`, khối "Ten apartments, ten names").
5. **Đặt phòng trên website = phương án A (ESC-020 L7-A, chờ INV)** (yêu cầu, không trả tiền online) – quy tắc ở BR-911…916: trả lời ≤ 15 phút trong giờ trực, giữ chỗ + VietQR cọc qua Zalo OA sau khi khách xác nhận, chống trùng/spam, tối đa 3 lần liên hệ khi khách im lặng. **Phương án B** chỉ thêm một quy tắc giá (BR-916), không đổi luồng.
6. **Nguồn "website"** có nguồn phụ `facebook` · `google` · `direct` · `other` suy từ UTM rồi tên miền giới thiệu, lưu trên yêu cầu và đi theo tới đơn (BR-911). Đơn sinh từ form luôn là `website` (đứng đầu thứ tự nguồn – BR-112).
7. **Một ràng buộc vận hành quan trọng:** Zalo OA **không chủ động nhắn** được người chưa từng tương tác (zalo-oa.md mục 1). Vì vậy trang cảm ơn phải mời khách **mở Zalo và gửi mã yêu cầu**; nếu khách không làm, lễ tân gọi điện (BR-913 (4)).

---

## 1. Định vị: boutique stay, không phải căn hộ dịch vụ

### 1.1 Câu định vị (nội bộ – để mọi vai viết thống nhất)
- **VI:** OTTIMO là một boutique stay ở Đà Lạt. Khách nhận được sự chăm chút của một khách sạn nhỏ – lễ tân, dọn phòng, giờ nhận/trả phòng rõ ràng, giấc ngủ ngon – trong những căn phòng rộng có bếp, máy giặt sấy, bàn làm việc và ban công riêng. Ở vài đêm, đó là điều vượt mong đợi; ở vài tháng, đó là điều cần có.
- **EN:** OTTIMO is a boutique stay in Da Lat: the care of a small hotel, in rooms with a full kitchen, a washer-dryer, a desk and a private balcony. For a few nights, more than you expected. For a few months, exactly what you need.
- Tagline thương hiệu giữ nguyên (Brand Guidelines mục 2): *A refined stay inspired by the calm spirit of Dalat.*

### 1.2 Ba loại hình – khách nhận ra bằng dấu hiệu gì, OTTIMO đứng ở đâu

| Dấu hiệu khách nhìn thấy | Khách sạn | Căn hộ dịch vụ | **OTTIMO – boutique stay** |
|---|---|---|---|
| Cách gọi chỗ ở | Phòng | Căn hộ, căn, unit | **Phòng** có tên (The Pine…), hạng phòng (Studio, Premium, Signature) |
| Nhận phòng | Giờ cố định, có lễ tân | Hẹn giao chìa, tự nhận | Giờ cố định 14:00/12:00 (BR-401), **lễ tân tầng trệt**, khóa điện tử để ra vào tự do |
| Dọn phòng | Hằng ngày | Theo gói, thường tính phí | **Ngắn ngày: hằng ngày** (BR-807); **theo tháng: gói tùy chọn** (BR-204) |
| Ở tối thiểu, giấy tờ | 1 đêm, không hợp đồng | Thường từ 1 tháng, hợp đồng, ký quỹ | **Từ 1 đêm** (đến thứ Sáu, thứ Bảy, ngày lễ: tối thiểu 2 đêm – BR-113); thuê tháng có hợp đồng + ký quỹ (BR-206) – chỉ nói ở mục "Theo tháng" |
| Trong phòng | Giường, phòng tắm, minibar | Bếp, máy giặt, đồ gia dụng | **Cả hai**: giường và chăn ga chuẩn khách sạn + bếp, máy giặt sấy, tủ lạnh lớn, bàn làm việc |
| Giọng văn, hình ảnh | Dịch vụ, tiện ích | Diện tích, nội thất, "như ở nhà" | **Yên tĩnh, chỉn chu, tiện dụng** (Brand: Calm · Warm · Refined · Functional · Contemporary) |

→ OTTIMO **lấy của khách sạn**: lễ tân, giờ giấc, dọn phòng, giấc ngủ, sự nhất quán. **Lấy của căn hộ**: không gian và thiết bị. Chữ trên landing luôn **gọi tên theo khách sạn** (phòng, nhận phòng, lễ tân) và **mô tả thiết bị theo căn hộ** (bếp, máy giặt sấy) – không bao giờ ngược lại.

### 1.3 Vì sao khách đang hiểu nhầm là căn hộ dịch vụ (e-brochure 2026 → concept v1.1)

| # | Câu hiện có (brochure/concept) | Hiệu ứng | Thay bằng (EN · VI) |
|---|---|---|---|
| 1 | "Một căn hộ ở Đà Lạt — để ở lại một tháng, hay lâu hơn." (dòng phụ hero của concept mục 5) | Nói thẳng "căn hộ" + chỉ khách ở dài | Bỏ. Dòng phụ VI = bản dịch tagline: "Một kỳ lưu trú chỉn chu, mang tinh thần an yên của Đà Lạt." |
| 2 | "A hotel is for visiting. Ottimo is for living." (concept giữ làm trích dẫn) | Chê khách sạn → khách đặt kiểu khách sạn thấy "không dành cho mình" | "Stay a night, or a season." · "Ở một đêm, hay cả một mùa." |
| 3 | "Move in, not check in." (tiêu đề About) | Ngôn ngữ thuê nhà | "Check in. Then settle in." · "Nhận phòng, rồi thong thả ở lại." |
| 4 | "Ottimo là mười căn hộ…", "not an extended hotel room" | Lộ số phòng + "căn hộ" + chê khách sạn | Xem mục 2.3 – không có câu tương đương |
| 5 | "Four ways to stay longer in Da Lat" (tiêu đề hạng phòng) | Hạng phòng chỉ cho khách ở dài | "Four ways to stay" · "Bốn hạng phòng" |
| 6 | "Everything a home has — ready to move in." (tiện nghi) | "Dọn vào" = thuê nhà | "Everything you need, already here." · "Mọi thứ cần có, đã sẵn sàng." |

---

## 2. Nói gì – tránh gì

### 2.1 Từ nên dùng
| EN | VI | Ghi chú |
|---|---|---|
| boutique stay | boutique stay (giữ nguyên) | Không dịch thành "khách sạn boutique" (tự nhận là khách sạn) hay "nhà nghỉ boutique" |
| room · studio · one-bedroom · two-bedroom | phòng · studio · phòng 1 phòng ngủ · phòng 2 phòng ngủ | "studio", "one-bedroom" là **mô tả hạng**, không phải "apartment" |
| stay · a few nights · a month or longer | ở · vài đêm · theo tháng / dài ngày | Hai độ dài ngang hàng |
| reception · housekeeping · check-in / check-out | lễ tân · dọn phòng · nhận phòng / trả phòng | Dấu hiệu khách sạn – đặt sớm trên trang |
| book direct · booking request · deposit | đặt trực tiếp · yêu cầu đặt phòng · đặt cọc | Phương án A: luôn nói "yêu cầu" (mục 3.6) |
| monthly rate · monthly agreement | giá theo tháng · hợp đồng theo tháng | Chỉ trong mục "Theo tháng" |

### 2.2 Tránh

| Tránh (EN / VI) | Vì sao | Dùng thay |
|---|---|---|
| serviced apartment, apartment(s), apartment-style, aparthotel, condotel, unit · căn hộ dịch vụ, căn hộ, căn, chung cư | INV không muốn khách hiểu là căn hộ dịch vụ (FB-INV-002 ý 2) | room, studio, one-/two-bedroom · phòng, hạng phòng |
| homestay, guesthouse, motel · homestay, nhà nghỉ | Brand: "không phải homestay giá rẻ" | boutique stay |
| hotel (tự nhận), "X-star", five-star, luxury, resort · khách sạn (tự nhận), 5 sao, sang trọng, resort 5 sao | Tự nhận loại hình/hạng sao chưa được công nhận có thể trái quy định quảng cáo cơ sở lưu trú (Luật Du lịch 2017 – **PHÁP LÝ – cần xác nhận**, mục 15 BR); Brand: "không luxury dát vàng" | "the care of a small hotel", "hotel-grade bedding" · "sự chăm chút của khách sạn nhỏ", "chăn ga chuẩn khách sạn" |
| lease, tenant, landlord, rental, move in · thuê nhà, người thuê, chủ nhà, dọn vào | Ngôn ngữ bất động sản | monthly stay · ở theo tháng (từ "hợp đồng" chỉ ở mục Theo tháng) |
| self check-in, no reception, contactless · tự nhận phòng, không cần lễ tân | Dấu hiệu căn hộ/Airbnb; sai sự thật (có lễ tân) | "Reception on the ground floor; a smart lock so you come and go freely" |
| ten rooms, 10 apartments, only 2 left · mười căn, 10 căn, chỉ còn 2 phòng | INV: không nhắc số phòng (FB-INV-002 ý 1) | Mục 2.3 |
| instant confirmation, book now – confirmed · xác nhận ngay | Phương án A không xác nhận tức thì | "Send a booking request – we reply within the hour" (mục 3.6) |
| best price guaranteed, free cancellation, no deposit, all-inclusive · cam kết giá rẻ nhất, hủy miễn phí, không cần cọc, trọn gói | Không có chính sách khớp giá; hủy theo bậc (BR-309); cọc 30% (BR-305); dài hạn điện nước theo công tơ (BR-501) | "Our direct rate", "Deposit 30%", "Cancellation terms" |
| Lầu 1–2, Căn N, Căn N+, số căn 101…402 | Tên nội bộ (BR-012) | Hạng phòng công khai, tên phòng |

### 2.3 Không nhắc số phòng – các chỗ đang lộ hoặc dễ lộ

| Chỗ | Hiện trạng | Việc | Vai |
|---|---|---|---|
| Khối "Inspired by nature – *Ten* apartments, ten names — none of them numbers." (concept mục 7) | Lộ số + "apartments"; liệt kê đủ 10 tên một chỗ cũng là lộ số | "Every room has a name, never a number." · "Mỗi phòng một cái tên, không có số." Tên phòng hiện **trong ảnh/thư viện của từng hạng** khi INV gửi bảng ghép; không đặt danh sách đủ tên ở một chỗ | UXD |
| JSON-LD `Hotel.numberOfRooms` (ADR-014 mục 5) | `10` | Bỏ thuộc tính này (Google có thể hiện ra) | ARC, FE-LP |
| E-brochure PDF (nếu cho tải) | "mười căn hộ", "ten fully equipped apartments", "5 sao" | **Không đăng bản hiện tại**; INV sửa brochure trước nếu muốn đăng (gửi qua ORC) | INV |
| `meta description`, `og:description`, mô tả ảnh (alt) | Chưa viết | Không có số phòng, không "apartment" | UXD |
| Phòng trống trên web (phương án B) | ADR-014 4.7 chỉ trả `available` | Giữ `public_site.show_scarcity` **tắt**; không "chỉ còn n phòng" | ARC (đã đúng) |
| Hỏi đáp | – | Không có câu "Có bao nhiêu phòng?"; khách hỏi qua chat thì lễ tân trả lời theo hạng phòng còn trống, không nói tổng | UXD, lễ tân |
| Ảnh | – | Không ảnh toàn cảnh hành lang/bảng phòng đếm được cửa (cùng điều kiện SEC UXD-02) | UXD |

### 2.4 Chỉ hứa điều vận hành đang làm

| Câu trên web | Căn cứ vận hành | Trạng thái | Ghi chú cho người viết |
|---|---|---|---|
| Lễ tân 07:00–22:00 | `front_desk_hours` (BR-811) | GIẢ ĐỊNH – INV duyệt ở L5 | Không viết "24/7". Ban đêm: "Khóa điện tử + số khẩn" |
| Nhận phòng 14:00, trả 12:00 | BR-401 | GIẢ ĐỊNH | Nhận sớm/trả muộn có phụ thu (BR-411, 412) |
| Dọn phòng hằng ngày | BR-807 (INV quyết ESC-008) | Chỉ **ngắn ngày** | **Không** đặt trong danh sách tiện nghi chung – khách thuê tháng sẽ hiểu là miễn phí hằng ngày. Mục Theo tháng ghi "gói dọn phòng tùy chọn" (BR-204) |
| Điện nước | Ngắn ngày: gồm trong giá; tháng: theo công tơ (BR-501) | INV quyết | Mỗi câu đặt **đúng khối** của nhóm khách; không câu chung "đã gồm điện nước" |
| Cáp quang 1 Gbps | Đường truyền; kiểm phòng đo Wi-Fi ≥ 50 Mbps (BR-808) | brochure | Viết "1 Gbps fibre line" / "đường truyền cáp quang 1 Gbps", không "1 Gbps Wi-Fi" |
| Giấc ngủ, chăn ga Dunlopillo | brochure | INV xác nhận còn đúng (US-148 AC1) | "hotel-grade bedding", không "5 sao" |
| Trả lời yêu cầu trong 1 giờ (07:00–22:00); gửi sau 22:00 → trước 09:00 sáng hôm sau | BR-912 | GIẢ ĐỊNH – INV duyệt ở L5 | Số lấy từ `web_inquiry.public_promise_minutes`, `web_inquiry.public_promise_next_morning_by`, không viết cứng; mục tiêu nội bộ chặt hơn (15 phút) |
| Cọc 30%, hủy theo bậc | BR-305, BR-309 (INV quyết ESC-006) | chính thức | Như US-149 |
| Check-in online | BR-976 (R3) | chưa chạy | Chỉ nói khi US-162 lên |
| Đỗ xe, thú cưng, gửi hành lý, đưa đón sân bay, bữa sáng, quầy cà phê | Chưa có BR/INV xác nhận | – | **Không viết** tới khi INV trả lời (ESC-020 "Còn thiếu" 5) |

---

## 3. Câu mẫu EN + VI cho hai nhóm khách

> Đây là chất liệu cho UXD biên tập (L5-A: đội viết, INV duyệt một lần). Giọng: ngắn, lịch sự, không cảm thán, không emoji, không IN HOA để nhấn. EN dẫn dắt, VI hỗ trợ.

### 3.1 Màn đầu
- H1 (giữ): *A refined stay inspired by the calm spirit of Dalat.*
- EN: "A boutique stay in Da Lat. The care of a small hotel, with a kitchen, a washer-dryer and a desk in every room."
- VI: "Boutique stay giữa Đà Lạt. Sự chăm chút của một khách sạn nhỏ, trong những căn phòng có bếp, máy giặt sấy và bàn làm việc riêng."
- Nút: "Book direct" · "Đặt trực tiếp" (mở form yêu cầu – mục 3.6) và "See the rooms" · "Xem phòng".

### 3.2 Hai cách ở (hai thẻ ngang hàng – không thẻ nào "chính")
| | EN | VI |
|---|---|---|
| Tiêu đề 1 | For a few nights | Ở vài đêm |
| Thân 1 | Check in at 14:00 to a quiet room and a bed made for deep sleep. Daily housekeeping, and a kitchen and washer-dryer if you want them. | Nhận phòng lúc 14:00: phòng yên tĩnh, giường cho giấc ngủ sâu. Dọn phòng mỗi ngày; bếp và máy giặt sấy có sẵn khi bạn cần. |
| Tiêu đề 2 | For a month, or longer | Ở một tháng, hay lâu hơn |
| Thân 2 | Unpack once. Cook in a real kitchen, do your laundry at home, work at a desk by the window. Monthly rates, housekeeping plans to suit you. | Dỡ vali một lần. Nấu ăn bằng bếp thật, giặt sấy ngay trong phòng, làm việc bên cửa sổ. Giá theo tháng, gói dọn phòng tùy chọn. |

### 3.3 Mỗi phòng có gì (một chỗ duy nhất liệt kê thiết bị – tránh lặp 3 lần như brochure)
- EN: "In every room: hotel-grade bedding, a full kitchen, an in-room washer-dryer, a work desk, a private balcony and a smart lock. Small luxuries for one night; the essentials for a month."
- VI: "Phòng nào cũng có: chăn ga chuẩn khách sạn, bếp đầy đủ, máy giặt sấy riêng, bàn làm việc, ban công và khóa điện tử. Một đêm thì là điều dễ chịu; một tháng thì là điều cần có."
- (Chi tiết hãng/model – nếu INV xác nhận – để trong phần mở rộng, không lên đầu.)

### 3.4 Dịch vụ (dấu hiệu khách sạn – đặt trước phần "Theo tháng")
- EN: "Reception on the ground floor, 07:00–22:00. Check-in 14:00, check-out 12:00. A smart lock, so late arrivals are easy."
- VI: "Lễ tân ở tầng trệt, 07:00–22:00. Nhận phòng 14:00, trả phòng 12:00. Khóa điện tử – đến muộn vẫn dễ dàng."

### 3.5 Theo tháng
- EN: "Stay by the month. From {price} a month, less for longer terms. Utilities by meter, a simple monthly agreement, and support when you need it – not supervision."
- VI: "Ở theo tháng. Từ {giá}/tháng, ở càng lâu giá càng tốt. Điện nước theo công tơ, hợp đồng theo tháng rõ ràng, có người hỗ trợ khi cần – không giám sát."
- `{price}` theo US-147 AC3 (L3-A) – lấy từ một nguồn, không viết tay.

### 3.6 Đặt trực tiếp (phương án A) và trang cảm ơn
- Tiêu đề + thân EN: "Book direct. Tell us your dates. We reply within the hour, 07:00–22:00 Da Lat time, with availability and your rate. Your room is held once you confirm and pay a 30% deposit."
- VI: "Đặt trực tiếp. Cho OTTIMO biết ngày bạn đến. Chúng tôi trả lời trong vòng 1 giờ (07:00–22:00, giờ Đà Lạt) kèm phòng trống và giá. Phòng được giữ khi bạn xác nhận và đặt cọc 30%."
- Nút gửi: "Send booking request" · "Gửi yêu cầu đặt phòng".
- Trang cảm ơn – EN: "Thank you. Your request number is {ref}. This is a request, not yet a booking. For the fastest reply, open Zalo and send us this number." Dòng phụ: "Not on Zalo? WhatsApp · Telegram · Viber · Email."
- VI: "Cảm ơn bạn. Mã yêu cầu: {ref}. Đây là yêu cầu, chưa phải đặt phòng. Để được trả lời nhanh nhất, mở Zalo và gửi mã này cho OTTIMO."
- Ngoài giờ trực – EN: "Our reception opens at 07:00. We will reply before 09:00." · VI: "Lễ tân làm việc lại từ 07:00. Chúng tôi sẽ trả lời bạn trước 09:00."
- Ngày đến là hôm nay – EN: "Arriving tonight? Calling is fastest: {phone}." · VI: "Đến trong tối nay? Gọi ngay cho nhanh: {phone}."
- Các số (1 giờ, 09:00, 07:00–22:00, 30%) đọc từ tham số (BR-912, BR-811, BR-305). Đây là chỗ DOM chốt câu hứa mà US-155 AC7 để ngỏ: **trong 1 giờ** (giữ như PO đề xuất); ngoài giờ **trước 09:00** (không phải "trước 8:00" như AC7 nháp – khách chỉ để lại SĐT thì 08:00 mới được gọi theo khung BR-973, nên cần đệm).

### 3.7 Hỏi đáp – ba câu giúp hai nhóm khách tự định vị
| EN | VI |
|---|---|
| **Is OTTIMO a hotel or an apartment?** OTTIMO is a boutique stay: a reception, daily housekeeping and hotel check-in times, in rooms with a full kitchen, a washer-dryer and a desk. Stay one night or several months. | **OTTIMO là khách sạn hay căn hộ?** OTTIMO là boutique stay: có lễ tân, dọn phòng mỗi ngày, giờ nhận – trả phòng như khách sạn, trong những căn phòng có bếp, máy giặt sấy và bàn làm việc. Ở một đêm hay vài tháng đều phù hợp. |
| **Is housekeeping included?** Daily for short stays. Monthly stays choose a plan that suits them. | **Có dọn phòng không?** Khách ở ngắn ngày được dọn mỗi ngày. Khách ở theo tháng chọn gói dọn phù hợp. |
| **Can I stay for a month?** Yes. Monthly rates start at {price}; longer terms cost less. Message us for a quote. | **Ở một tháng được không?** Được. Giá theo tháng từ {giá}; ở càng lâu giá càng tốt. Nhắn OTTIMO để nhận báo giá. |

### 3.8 Liên hệ (ý 4)
- Nút chính (mọi ngôn ngữ): "Chat on Zalo" · "Nhắn Zalo" → Zalo OA.
- Dòng phụ, chữ nhỏ, một chạm: "Other ways: WhatsApp · Telegram · Viber · Email · Call" · "Cách khác: WhatsApp · Telegram · Viber · Email · Gọi".
- Chân trang: "OTTIMO on Facebook" · "OTTIMO trên Facebook" → liên kết thường tới `https://www.facebook.com/profile.php?id=100091335431646`.

---

## 4. Từng hạng phòng: khách đặt kiểu khách sạn được thêm gì – khách ở dài thấy "sinh ra cho mình" ở đâu

> Ánh xạ nhóm nội bộ theo cấu hình giường INV gửi 16/10 (BR-110, mục 13 `room.<no>.bed_config`): **Premium 1 phòng ngủ + 1 = Căn N+ (302, 402)**, **Signature 2 phòng ngủ = Căn N (301, 401)**; hai hạng Studio thuộc Lầu 1–2. Concept mục 7 đang đoán ngược (Căn N = Premium) – **UXD sửa**; vẫn chờ bảng ghép chính thức của INV (hẹn 19/10). Cột "Ở" theo BR-110: định mức đã gồm trong giá / tối đa khi có người ngủ sofa (có phụ thu người, BR-110); trẻ dưới 6 tuổi không tính.

| Hạng (khách thấy) | Nhóm nội bộ | Ở | Khách đặt kiểu khách sạn được thêm | Khách ở dài thấy "sinh ra cho mình" | Câu mẫu EN | Câu mẫu VI |
|---|---|---|---|---|---|---|
| **Studio · City View** – 29 m² | Lầu 1–2 (một phần) | 2 / 3 | Rộng hơn một phòng đôi thông thường; tự pha trà, làm bữa sáng; giặt sấy để mang hành lý gọn; bàn làm việc nhìn phố | Một ngôi nhà gọn: bếp nấu hằng ngày, máy giặt sấy riêng, tủ áo, bàn cạnh cửa sổ | "City lights from your desk. A studio with its own kitchen and washer-dryer – easy for a weekend, easy for a month." | "Phố đêm ngay bên bàn làm việc. Studio có bếp và máy giặt sấy riêng – gọn cho một cuối tuần, đủ cho một tháng." |
| **Studio · Garden View** – 28–34 m² | Lầu 1–2 (một phần) | 2 / 3 | Cửa kính lớn, ban công riêng nhìn vườn, yên tĩnh – điều phòng khách sạn phố hiếm có | Ban công cho cây và nắng sớm; góc làm việc yên cho cuộc gọi; hai phong cách (gỗ sáng rộng nhất tầng hoặc navy gọn) | "Glass to the garden and a private balcony. Morning light for a short stay; a quiet desk for the weeks after." | "Cửa kính nhìn ra vườn và ban công riêng. Nắng sớm cho chuyến đi ngắn; góc làm việc yên tĩnh cho những tuần ở lại." |
| **Premium · One Bedroom + 1** – 37 m² | Căn N+ | 3 / 4 | Phòng ngủ tách phòng khách như một suite; gia đình 3 người hay ba người bạn có giường riêng mà không phải đặt hai phòng | Chỗ cho người thân ghé thăm; một người làm việc ở phòng khách khi người kia ngủ; bếp dài cho bữa cơm hằng ngày | "A bedroom, a living room and an extra bed. The space of a suite for a short stay; room for family to visit on a long one." | "Phòng ngủ riêng, phòng khách riêng và thêm một giường. Rộng như một suite cho chuyến đi ngắn; đủ chỗ đón người thân khi ở lâu." |
| **Signature · Two Bedrooms** – 47 m² | Căn N | 4 / 5 | Hai phòng ngủ, bàn ăn bốn người: một lần đặt thay cho hai phòng khách sạn; ban công hoàng hôn | Hai người làm việc từ xa mỗi người một phòng; gia đình ở dài ngày; chia chi phí | "Two bedrooms, a table for four and a sunset balcony. One booking for the whole family, or for two remote workers over a season." | "Hai phòng ngủ, bàn ăn bốn người và ban công đón hoàng hôn. Một lần đặt cho cả gia đình, hoặc cho hai người cùng làm việc từ xa nhiều tháng." |

Lưu ý câu chữ:
- Sức chứa trên thẻ: "Sleeps 2 · up to 3 using the sofa (extra-guest fee)" · "2 khách · tối đa 3 khi dùng sofa (phụ thu)". Không ghi "sofa bed" – BR-110 là sofa lớn có sẵn, không nệm phụ.
- Premium: brochure ghi "1 giường đơn", cấu hình INV gửi là **giường 1m4** (BR-110) → viết "an extra bed (1.4 m)" · "thêm một giường 1m4"; INV xác nhận khi duyệt L5.
- "Rộng hơn phòng khách sạn thông thường" là ý để viết, **không** đưa số so sánh diện tích với khách sạn khác (không có nguồn).
- Không ghi số căn mỗi hạng (mục 2.3).

---

## 5. Yêu cầu đặt phòng từ website – quy tắc xử lý (phương án A)

> Quy tắc đầy đủ và ví dụ số: **BR-911…BR-916** (nhóm 11A, `business-rules.md` v0.3.7). Mục này là bản tóm tắt cho UXD, PO, BA, FE-LP.

### 5.1 Khách thấy gì (phương án A)
1. Nút "Book direct" (và nút "Book now" của fanpage Facebook) mở **form yêu cầu**: ngày đến/đi (hoặc số tháng), hạng phòng, **người lớn (từ 12 tuổi) · trẻ 6–11 · trẻ dưới 6** (ba ô đếm khớp BR-110 để báo giá đúng mà không hỏi tuổi), tên, **một** cách liên hệ, ngôn ngữ, lời nhắn, ô đồng ý (SEC C-3).
2. Thuê tháng: `months` là số nguyên 1–24, chọn nhanh 1 · 3 · 6 · 12 (khớp BR-201, BR-202); trên 24 tháng ghi trong lời nhắn (trả lời câu "khoảng kỳ hạn cho form" ADR-014 mục 10).
3. Tổng người tính định mức vượt **sức chứa tối đa** của hạng đã chọn (BR-110) → form không gửi, gợi ý "Nhiều người hơn? Nhắn Zalo – có thể đặt hai phòng" (đơn nhóm BR-321).
4. Trang cảm ơn: mã yêu cầu, câu "đây là yêu cầu, chưa phải đặt phòng", nút **Mở Zalo** (gửi mã), giờ trả lời (mục 3.6).

### 5.2 Desk làm gì (BR-913)
| Bước | Việc | Quy tắc |
|---|---|---|
| 1 | Yêu cầu vào hàng chờ "Yêu cầu từ website"; người đầu tiên bấm "Nhận xử lý" | FD, FDL, SAL, MGR, OWN; không CTV; thông báo không có tên/SĐT (ADR-014 4.3, 4.6) |
| 2 | Sàng lọc trùng/spam (≤ 1 phút) | BR-914 |
| 3 | Kiểm phòng trống theo hạng + ngày; sức chứa (BR-110), ở tối thiểu (BR-113), cửa sổ bán (BR-112); ≥ 28 đêm/thuê tháng → báo giá dài hạn (BR-108) | Hết phòng → hạng khác cùng ngày → cùng hạng ngày gần → hai phòng nối tiếp (khách đồng ý đổi phòng giữa kỳ); không có → báo khách rồi đóng `no_availability` |
| 4 | Liên hệ trong hạn BR-912 qua kênh khách chọn (BR-972) | Khách đã nhắn OA/WhatsApp kèm mã → trả lời ở đó. Khách chọn Zalo **nhưng chưa nhắn OA** → OA không nhắn trước được → **gọi số đó** (khung gọi [08:00, 21:00)) và mời nhắn OA kèm mã. Tin đầu: chào, mã yêu cầu, còn/hết phòng, giá (báo giá US-080), cách giữ chỗ. **Chưa** gửi VietQR hay link có token |
| 5 | Xác nhận liên hệ = khách trả lời từ đúng số/tài khoản/email (hoặc nghe máy) | SEC INT-09 (6) |
| 6 | Gửi báo giá = **chuyển thành lead** (`source = website` + nguồn phụ), chọn/tạo hồ sơ qua GuestPicker (BR-951) | Đồng ý trên form chỉ để trả lời yêu cầu → ô ưu đãi của hồ sơ để **chưa hỏi** (BR-955, BR-971). Yêu cầu → `converted`, xóa dữ liệu cá nhân trên yêu cầu |
| 7 | Khách đồng ý → giữ chỗ từ báo giá → **VietQR cọc qua chat Zalo OA** (hoặc kênh khách đang dùng) kèm câu chống giả danh | Giữ chỗ 12/24/48 giờ, mặc định 24, trần 12:00 ngày đến; đến hôm nay → không giữ chỗ, thu cọc ngay (BR-302). Cọc 30% tiền phòng (BR-305). Giữ chỗ **chỉ** do nhân viên tạo (BR-906) |
| 8 | Có tiền → `confirmed` → tin xác nhận ≤ 15 phút (TP-01), mời check-in online | BR-527 (ghi tay chờ đối soát), BR-975, BR-976. Không cọc online được → BR-527 (đến trong 2 ngày, quản lý duyệt). Hết hạn giữ chỗ → BR-303 |

Ví dụ (BR-913): yêu cầu 09:05 thứ Ba 20/10, Studio, 2 người lớn, 23–26/10 → trả lời trước 09:20: 911.000 + 911.000 + 792.000 = **2.614.000**; giữ chỗ 09:30, hạn **09:30 21/10**; cọc **800.000**, còn **1.814.000** thu khi nhận phòng.

### 5.3 Hạn phản hồi (BR-912)
| Lúc yêu cầu vào | Hạn phản hồi đầu |
|---|---|
| Trong giờ trực [07:00, 22:00) | + 15 phút (`web_inquiry.response_minutes`); quá 15 → "Cần chú ý"; quá 30 → báo lễ tân trưởng/quản lý |
| Ngoài giờ trực | 07:15 sáng hôm sau; nếu chỉ gọi điện được → 08:15 (khung gọi) |
| Ngoài giờ, **ngày đến = ngày nghiệp vụ hiện tại** (đêm nay) | Báo ngay người trực đêm/lễ tân trưởng, mục tiêu 30 phút; trang cảm ơn hiện số gọi |
| Câu hứa công khai | Trong 1 giờ (`web_inquiry.public_promise_minutes` = 60); gửi ngoài giờ → trước 09:00 sáng hôm sau (`web_inquiry.public_promise_next_morning_by`) – lỏng hơn mục tiêu nội bộ để giờ cao điểm không thất hứa |

### 5.4 Trùng và spam (BR-914)
- Cùng SĐT/email, cùng còn mở, ngày giao nhau **hoặc** gửi cách nhau ≤ 24 giờ → cờ "Có thể trùng"; lễ tân giữ **một** bản (dữ liệu mới nhất, nguồn phụ của bản đầu), đóng bản còn lại `duplicate`. Không tự gộp.
- Server: ≤ 3 yêu cầu/ngày/liên hệ, lần sau trả kết quả giống hệt, không tạo bản ghi (SEC ARC-04); không bao giờ cho biết SĐT đã có hồ sơ.
- Trùng với đơn đã có → hỏi lại khách, đóng `already_booked`, không tạo đơn thứ hai.
- Spam (quảng cáo, vô nghĩa, người nhận nói "tôi không gửi") → không liên hệ thêm, không tạo hồ sơ, xóa sau 7 ngày. Spam > 10/tuần trong 2 tuần liền → ARC bật tầng 2 (ADR-014 4.4). Trần ngày 100 → trang báo bận, mời nhắn Zalo/gọi (SEC ARC-02).

### 5.5 Khách không trả lời (BR-915)
| Ngày đến | Lần 2 | Lần 3 (cuối) | Đóng `unreachable` |
|---|---|---|---|
| Từ ngày kia trở đi | +4 giờ, kênh thứ hai, trong [08:00, 21:00) | 10:00 ngày sau lần 2 | Lần 1 + 72 giờ |
| Hôm nay hoặc ngày mai | Gọi điện sau 30 phút | – | Sớm hơn của: lần 1 + 72 giờ, 06:00 ngày sau ngày đến |

Tối đa 3 lần liên hệ khi khách chưa từng trả lời; không kèm ưu đãi để "kéo" khách (chưa có đồng ý marketing – BR-971). Khách nhắn lại sau khi đóng → mở lại, tính giá lại nếu báo giá đã hết hiệu lực (BR-304). Đã giữ chỗ mà chưa cọc → BR-303.

### 5.6 Chuyển sang phương án B (phòng trống + giá thật – US-131) – chỉ thêm, không đổi luồng
- Giá web = cùng bộ tính báo giá kênh Trực tiếp (ADR-014 4.7). Form gửi kèm ảnh chụp giá.
- **BR-916:** báo giá = **min**(giá web lúc khách gửi, giá tính lại) nếu xử lý trong 24 giờ và giá web không dưới tổng giá sàn (BR-105); "còn phòng" trên web không giữ phòng; không hiện số phòng còn lại.
- Đây là cam kết giá công khai → **[GIẢ ĐỊNH – chờ INV]**, chỉ áp khi INV chọn **ESC-020 L7-B**. Lưu ý của ADR-014 mục 12: hiện giá đêm công khai có thể vướng điều khoản ngang giá của OTA [Chưa xác minh] – đây là lý do phương án A an toàn hơn cho v1 (giá chỉ gửi riêng qua chat).
- Mọi BR-911…915 giữ nguyên khi chuyển B.

---

## 6. Nguồn "website" và nguồn phụ (BR-112, BR-911)

### 6.1 Thứ tự nguồn (BR-112 sửa v0.3.7)
- Đơn sinh từ **yêu cầu website** luôn `directSource = website` do server đặt – đứng **trên** `sales_staff` và `returning` (bằng chứng hệ thống thắng lựa chọn của nhân viên). Khách cũ đặt qua website vẫn đếm là khách quay lại từ **hồ sơ** (BR-112 đã quy định); hoa hồng theo **người chốt**, không theo nguồn (BR-903).
- **Khách xem website rồi tự nhắn Zalo/WhatsApp/gọi** (không qua form): nguồn theo **cửa liên hệ** (`zalo_phone`…). Chỉ là `website` khi tin đầu mang **mã yêu cầu** của form (khi đó gắn vào yêu cầu đó). → Trả lời câu hỏi US-151 AC4 / landing-scope mục 6.

### 6.2 Bảng suy nguồn phụ (server làm một lần lúc nhận yêu cầu)
| Thứ tự | Có gì | Nguồn phụ |
|---|---|---|
| 1 | `utm_source` thuộc `web_attribution.facebook_sources` (facebook, fb, messenger…) | `facebook` |
| 1 | `utm_source` thuộc `web_attribution.google_sources` (google, gbp, google_maps…) | `google` |
| 1 | `utm_source` khác (instagram, zalo, qr, tiktok…) | `other` |
| 2 | Không UTM, tên miền giới thiệu là Facebook (facebook.com, l.facebook.com, m.facebook.com, fb.com…) | `facebook` |
| 2 | Không UTM, tên miền giới thiệu là Google (google.\*, maps.google.\*…) | `google` |
| 2 | Không UTM, tên miền giới thiệu khác (không phải tên miền OTTIMO) | `other` |
| 3 | Không UTM, không có tên miền giới thiệu ngoài | `direct` |

- UTM thắng tên miền giới thiệu. Chữ hoa/thường không tính. `direct` = "không biết từ đâu tới" (gõ địa chỉ, đánh dấu trang, QR in không UTM, ứng dụng chặn thông tin giới thiệu) – DATA đọc đúng nghĩa này.
- Lý do thêm `other` (ngoài 3 giá trị facebook · google · direct ORC nêu): nếu không, khách từ Instagram, Zalo OA, mã QR sẽ bị dồn vào `direct` và làm sai số "khách tự tìm đến". Giá trị UTM gốc vẫn lưu để DATA xem chi tiết; thêm nguồn phụ có tên mới sau này chỉ là sửa danh sách cấu hình.

### 6.3 Đường dẫn chuẩn (OTTIMO tự gắn UTM – INV đặt nút, đội đưa link)
| Nơi đặt | Đường dẫn (tên miền thật thay `<tên-miền>`) | Nguồn phụ |
|---|---|---|
| Nút "Book now" của fanpage Facebook (người quản trị trang đặt) | `https://<tên-miền>/vi/?utm_source=facebook&utm_medium=social&utm_campaign=page_book_button` (bản EN bỏ `/vi`) | facebook |
| Bài đăng Facebook | `…?utm_source=facebook&utm_medium=social&utm_campaign=post_<yyyymm>` | facebook |
| Hồ sơ Google Business (ô Website) | `…?utm_source=google&utm_medium=gbp&utm_campaign=profile` | google |
| Menu Zalo OA | `…?utm_source=zalo&utm_medium=oa&utm_campaign=menu` | other |
| Instagram (nếu có) | `…?utm_source=instagram&utm_medium=social&utm_campaign=bio` | other |
| Mã QR in (thẻ, brochure) | `…?utm_source=qr&utm_medium=print&utm_campaign=<tên ấn phẩm>` | other |

- **Không** dùng tính năng đặt lịch/biểu mẫu/đặt phòng gốc của Facebook: dữ liệu khách nằm ở Meta, không vào Desk (trái ESC-002, SEC C-1). Nút "Book now" của fanpage chỉ là **liên kết** tới form website.

### 6.4 Lưu gì, không lưu gì (khớp ADR-014 4.5, 4.6, 6.1 và SEC ARC-09)
- **Lưu trên yêu cầu:** `utm_source`, `utm_medium`, `utm_campaign` (chuẩn hóa chữ thường, giới hạn ký tự ADR-014 4.5), **`ref_host`** (chỉ tên miền), `landing_path`, `website_sub_source`. Đi theo sang lead và đơn (snapshot – BR-006). Không phải dữ liệu cá nhân → giữ lại cho DATA sau khi xóa trường C2.
- **Không lưu:** URL giới thiệu đầy đủ, tham số nhấp quảng cáo `fbclid`, `gclid`, `gbraid`, `wbraid`, `msclkid`… (`web_attribution.drop_params`), IP rõ, User-Agent.
- **Việc cho ARC** (không sửa ADR ở đây): (a) thêm cột `ref_host`, `website_sub_source` vào `booking_inquiry`; `lead` và `reservation` thêm `website_sub_source` + liên kết yêu cầu gốc; (b) giữ UTM của **lượt xem** tới lúc gửi form mà **không** dùng cookie/localStorage (điều kiện "không banner" ADR-014 6.3) – ví dụ form nằm cùng trang, hoặc giữ tham số trên liên kết nội bộ; mất dấu thì rơi về `direct` (chấp nhận, ghi rõ trong định nghĩa chỉ số); (c) bỏ `numberOfRooms` khỏi JSON-LD (mục 2.3).

### 6.5 Trước khi có form (v1, nút chỉ mở chat)
- Đơn của khách nhắn từ nút trên website → `zalo_phone` như mọi tin nhắn (cửa liên hệ). Muốn đo sớm: FE **có thể** đưa thẻ nguồn vào **tin soạn sẵn** của WhatsApp (`?text=` – ví dụ "… (web-fb)"); khi tin đầu có thẻ đó, lễ tân chọn `website`, nguồn phụ để trống. Zalo/Telegram không hỗ trợ soạn sẵn [Chưa xác minh] → phần lớn sẽ không đo được ở v1 – chấp nhận; đo đầy đủ khi có form (US-155) và bộ đếm (US-158).

### 6.6 Facebook – chỉ là liên kết thường
- Chân trang + mục liên hệ: `<a href="https://www.facebook.com/profile.php?id=100091335431646">`. **Không** SDK, plugin trang, nút Thích, Messenger nhúng, pixel (SEC C-1, ADR-014 2.6). JSON-LD `sameAs` được thêm link này.
- **Messenger của fanpage là một hộp thư nữa** – khách sẽ nhắn ở đó. Đề xuất INV (qua ORC): bật tin trả lời tự động của trang: "For the fastest reply, message us on Zalo: {link} or send a booking request at {website}." và lễ tân xem Messenger trong giờ trực (thiết bị/tài khoản của cơ sở – BR-972). Đơn từ Messenger → `zalo_phone` ("Zalo/điện thoại/mạng xã hội" – BR-112).

---

## 7. Kênh chat (ý 4) – góc vận hành
- **Zalo OA là cửa chính** cho cả tiếng Việt lẫn tiếng Anh (FB-INV-002 ý 4 – thay thứ tự "EN xếp WhatsApp trước" của ESC-020 L2-A/US-151 AC1; PO sửa AC).
- WhatsApp · Telegram · Viber · email · gọi điện: một dòng chữ nhỏ "Cách khác" ngay dưới nút Zalo – "khó tìm một chút" nhưng **một chạm** là thấy. Rủi ro: khách Nga/Hàn/Âu ít dùng Zalo; bù lại bằng **form yêu cầu là lối chính** cho mọi khách (phương án A). UXD cân nhắc mở sẵn dòng "Cách khác" ở bản EN nếu INV đồng ý khi duyệt L5.
- Kênh phụ vẫn phải **có người xem trong giờ trực, cùng chuẩn 15 phút** (BR-912 (6)) – một kênh không ai trực còn tệ hơn không có kênh. Dùng bản web trên thiết bị của cơ sở, tài khoản của cơ sở (BR-972).
- Mọi tin có số tiền/VietQR kèm câu chống giả danh (BR-978); mã cửa không bao giờ gửi qua Zalo/WhatsApp/Messenger (BR-978).

---

## 8. Việc các vai cần làm (gửi qua ORC – DOM không sửa sản phẩm của vai khác)

| Vai | Việc | Căn cứ |
|---|---|---|
| UXD | Viết lại nội dung v1.2 theo mục 1–4; bỏ 6 câu ở mục 1.3; bỏ "Ten apartments"; dịch vụ (mục 3.4) đặt trước "Theo tháng"; một chỗ duy nhất liệt kê thiết bị; sửa ánh xạ Premium/Signature ở concept mục 7; trang cảm ơn có nút "Mở Zalo" + mã; Zalo là nút chính, kênh khác một dòng; Facebook ở chân trang | FB-INV-002 ý 1, 2, 4, 5 |
| PO | US-151 AC4 (trả lời: mục 6.1); US-155 AC1 (ba ô đếm người, `months` 1–24), **AC2 sửa thứ tự nguồn**: đơn từ yêu cầu web luôn `website`, **không** nhường `sales_staff`/`returning` (BR-112 v0.3.7), AC6 nhãn "Website · Facebook" = nguồn phụ BR-911 (xác nhận giả định PO: không thêm giá trị `directSource` mới), **AC7** câu hứa = trong 1 giờ / ngoài giờ trước 09:00 (BR-912), **AC8** ngưỡng "Cần chú ý" = chưa có phản hồi đầu sau 15 phút (BR-912); thêm AC không trả lời (BR-915); US-158 AC2 chia theo nguồn phụ | BR-112, 911–915 |
| BA | Máy trạng thái `booking_inquiry` (SM mới): mã đóng của BR-913 (9); việc `stale`, `unreachable`, `duplicate`; mở lại; use case "Xử lý yêu cầu từ website" theo mục 5.2 | ADR-014 4.3; BR-913 |
| ARC | Mục 6.4 (a)–(c); tham số mới mục 13 BR; job `booking_inquiry.attention` theo BR-912 (giờ trực + ngoại lệ đêm nay) và lịch nhắc BR-915 | ADR-014 4.9 |
| SEC | Rà `ref_host`, danh sách `drop_params`, chính sách không lưu mã nhấp quảng cáo; xác nhận mặc định hạn lưu DOM chọn (`stale_days` 14 trong biên 7–60) | SEC ARC-03, ARC-09 |
| FE-LP | Link Facebook thường; Zalo chính; (tùy chọn) thẻ nguồn trong tin soạn sẵn WhatsApp; bỏ `numberOfRooms` | mục 6.5, 6.6 |
| DATA | Chỉ số: thời gian phản hồi đầu (chỉ tính giờ trực), % trong 15 phút, yêu cầu → đơn `confirmed` theo nguồn phụ, tỉ lệ `unreachable`, tỉ lệ spam; `direct` = không rõ nguồn | BR-911, 912, 915 |
| QA | Ca kiểm từ `br-examples.json` BR-911…916 và BR-112-02 | – |
| INV (ORC chuyển, **không phải câu hỏi mới**) | Đặt nút "Book now" fanpage + ô Website hồ sơ Google theo bảng 6.3 khi có tên miền; bật trả lời tự động Messenger (6.6); xác nhận giờ lễ tân 07:00–22:00 và câu "trả lời trong 30 phút" khi duyệt nội dung L5; không đăng e-brochure bản có "mười căn hộ"/"5 sao" | ESC-020 L5 |

---

## 9. Mã BR mới / sửa (business-rules.md v0.3.7)
- **Sửa:** BR-112 (thứ tự nguồn `website` đứng đầu khi có yêu cầu web; khách tự nhắn sau khi xem web = cửa liên hệ; nguồn phụ), BR-907 (Cần chú ý: yêu cầu web quá hạn).
- **Mới – nhóm 11A:** BR-911 (nguồn phụ, UTM, mang theo tới đơn), BR-912 (hạn phản hồi), BR-913 (quy trình Desk phương án A), BR-914 (trùng, spam), BR-915 (không trả lời), BR-916 (phương án B – giá web).
- **Tham số mới (mục 13):** `web_inquiry.response_minutes`, `.escalate_minutes`, `.public_promise_minutes`, `.public_promise_next_morning_by`, `.same_day_after_hours_minutes`, `.followup_hours`, `.followup_final_time`, `.urgent_call_minutes`, `.no_reply_close_hours`, `.duplicate_window_hours`, `.stale_days`, `.retention_days_closed`, `.retention_days_spam`, `.max_age_days`, `.ip_hmac_days`, `.offer_honor_hours`; `public_site.inquiry_daily_cap`, `public_site.spam_pow_threshold_per_week`; `web_attribution.facebook_sources/google_sources/facebook_hosts/google_hosts/drop_params`.
- **Mục 14** thêm S13, S14, S15; **mục 15** thêm dòng "Website đặt phòng và lời quảng cáo"; **mục 17** dòng đề xuất decision-log; **mục 18** lịch sử v0.3.7.

## 10. Giả định
- [GIẢ ĐỊNH – chờ INV] INV chọn **ESC-020 L7-A** (đội đề xuất; FB-INV-002 ý 3); BR-916 viết sẵn cho L7-B.
- [GIẢ ĐỊNH – chờ INV] Giờ trực 07:00–22:00 (BR-811), mục tiêu nội bộ 15 phút, câu hứa công khai 1 giờ (ngoài giờ: trước 09:00) – INV duyệt cùng nội dung L5, **không mở ESC riêng**.
- [GIẢ ĐỊNH] Có người trực đêm/lễ tân trưởng nhận thông báo khẩn ngoài giờ (như BR-811 "Báo hỏng") để xử lý yêu cầu "đến đêm nay".
- [GIẢ ĐỊNH] Ánh xạ Premium = Căn N+ (302, 402), Signature = Căn N (301, 401) suy từ cấu hình giường INV gửi 16/10; chờ bảng ghép chính thức (19/10).
- [Chưa xác minh] Zalo OA không cho nhắn trước người chưa tương tác (theo zalo-oa.md mục 1, INT trích tài liệu Zalo); liên kết Zalo/Telegram không hỗ trợ tin soạn sẵn.
- [PHÁP LÝ – cần xác nhận] Tự nhận "khách sạn"/hạng sao khi chưa được công nhận có thể trái quy định về loại, hạng cơ sở lưu trú (Luật Du lịch 2017 và nghị định xử phạt) – đội tự tránh trong chữ; đề nghị ORC thêm vào danh sách câu hỏi luật sư ESC-001 cùng LZ-8.

## 11. Rủi ro
| # | Rủi ro | Giảm thiểu |
|---|---|---|
| R1 | Khách quốc tế không có Zalo, kênh khác "khó tìm" → mất khách | Form là lối chính; dòng "Cách khác" một chạm; DATA theo dõi tỉ lệ bấm theo ngôn ngữ (US-158) |
| R2 | Khách chọn Zalo nhưng không mở Zalo sau khi gửi → OA không nhắn được | Trang cảm ơn mời gửi mã; lễ tân gọi điện (BR-913 (4)) |
| R3 | Giờ cao điểm nhận phòng (14:00–16:00) lễ tân không kịp 15 phút | "Cần chú ý" ở 15 phút, báo lễ tân trưởng ở 30 phút; câu hứa công khai 1 giờ |
| R4 | Mất UTM khi khách chuyển trang (không cookie) → `direct` phình | Gắn UTM ở mọi link OTTIMO đặt; định nghĩa `direct` = "không rõ" |
| R5 | Nội dung mới vẫn bị đọc thành "căn hộ" vì danh sách OTA ghi loại chỗ ở "Apartment" | Ngoài phạm vi landing; INV cân nhắc sau (đổi loại chỗ ở trên OTA ảnh hưởng xếp hạng – cần xem từng kênh) |
| R6 | Lời hứa trên web lệch vận hành (dọn hằng ngày cho khách tháng, 24/7…) → khiếu nại | Bảng 2.4; mỗi câu đặt đúng khối của nhóm khách |

## 12. Nguồn
- Nội bộ: FB-INV-002; Brand Guidelines v1.0 (tóm tắt đội); e-brochure 2026 (`ebrochure-text.md`); ADR-014 mục 2.6, 4.3–4.9, 5, 6; SEC `landing-zalo-SEC.md` (C-1, C-2, C-3, ARC-02…09, INT-09); INT `zalo-oa.md` mục 1 (điều kiện tin tư vấn OA); BR-110, 112, 204, 302, 305, 401, 807, 811, 951, 955, 971–978.
- Bên ngoài: không tra thêm trong lượt này. Phần pháp lý (Luật Du lịch 2017 – loại và hạng cơ sở lưu trú) ghi theo hiểu biết của DOM, **không phải ý kiến pháp lý**.
