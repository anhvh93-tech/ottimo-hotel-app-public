# Landing page OTTIMO – Concept v0.1

- Người viết: UXD | Round 2 (Sprint 3 đang đóng, trước Sprint 4) | Ngày: 17/10/2026
- Trạng thái: **Bản nháp chờ review** (bắt buộc: UXR, PO; khuyến nghị: FE, DOM, SEC – quyền riêng tư, DATA – đo lường, OPS – tên miền và hiệu năng).
- Mock hi-fi: `product/design/landing/mock/index.html` (một file, mở thẳng bằng trình duyệt).
- Căn cứ: INV 17/10 (nguyên văn trong yêu cầu của ORC), `04-investor-feedback/FB-INV-001.md`, PRD M13 / M15 / A6, backlog EP18 (US-131, US-132) và US-034, US-040, US-108, US-116, US-126, US-138, `integrations.md` I7 + mục 3.4, `hosting-plan.md` mục 5.1, ESC-010, `design-system.md` v0.3.5, `content-guide.md`, `research/personas.md` P4–P7, `business-rules.md` BR-101, BR-110, BR-305, BR-401, BR-506, BR-511, BR-811.
- Quy ước: **[Chưa xác minh]** = đội chưa kiểm được; **[Chờ INV]** = chỉ INV có thông tin hoặc quyền quyết; **[Nguồn]** = có link ở mục 17.

---

## 0. Tóm tắt

- Landing là **một trang dài, ưu tiên điện thoại**, tiếng Việt trước, trên **tên miền gốc** (ví dụ `ottimo.vn` – [Chờ INV], INV đang mua tên miền). Các tên miền con `desk.`, `staff.`, `g.` giữ nguyên cho app.
- Hai nút chính xuyên trang: **Đặt phòng** (nút chính) và **Chat Zalo** (nút phụ). Trên điện thoại có thanh dính đáy chứa cả hai.
- Hướng hình ảnh đề xuất **A – "Kem – sồi, chạm đất nung"**: giữ nguyên Design System của app, thêm một họ màu đất nung chỉ để trang trí. **Biến thể B** cho đất nung dẫn dắt (nút chính, dải màu) – chỉ dùng nếu e-brochure xác nhận đất nung là màu thương hiệu.
- Ảnh thật chưa tải: mock dùng **ô ảnh trung tính có mã** (HERO-01, ROOM-S-01…), mỗi ô ghi thư mục Drive nguồn và loại ảnh cần.
- Mục tiêu hiệu năng: **LCP ≤ 2,5 giây** ở phân vị 75 (đo thực tế), **≤ 2,0 giây** trong phòng lab với cấu hình Lighthouse "Slow 4G". Ảnh AVIF + WebP, nhiều cỡ.

## 1. Mục tiêu và đối tượng

### 1.1 Mục tiêu
| # | Mục tiêu | Cách đo (đề xuất cho DATA) |
|---|---|---|
| M-1 | Khách tìm hiểu OTTIMO ở một chỗ đáng tin, thay cho hỏi lại qua chat | Tỉ lệ cuộn tới mục Căn hộ; số câu hỏi lặp lại trong Zalo giảm (lễ tân ghi nhận) |
| M-2 | Kéo khách về **kênh trực tiếp** (giảm phí OTA – PRD G3, mục tiêu ≥ 35% doanh thu phòng) | Số lượt bấm "Đặt phòng", "Hỏi phòng qua Zalo"; số hội thoại Zalo bắt đầu từ web |
| M-3 | Đưa khách vào **Zalo OA** để OTTIMO chăm sóc trước – trong – sau lưu trú (ý INV 17/10) | Số lượt bấm "Chat Zalo", "Quan tâm OA" |
| M-4 | Lọc sớm khách **thuê tháng** và người làm việc từ xa | Lượt bấm "Nhận báo giá thuê tháng" |
| M-5 | Nhanh trên mạng di động yếu | LCP, CLS, INP (mục 7) |

### 1.2 Đối tượng
| Nhóm | Persona | Họ cần gì trên trang | Nút chính | Ngôn ngữ | Kênh chat |
|---|---|---|---|---|---|
| Khách nội địa ngắn ngày (gia đình, cặp đôi) | P5 – gia đình anh Hưng | Ảnh thật, giá rõ, chỗ cho trẻ nhỏ và người lớn tuổi, đậu xe, cách cọc | Đặt phòng → hỏi qua Zalo | VI | Zalo |
| Khách quốc tế ngắn ngày | P7 – Ji-woo | Ảnh, vị trí, nhận phòng muộn thế nào, có người hỗ trợ không | Book now / Chat with us | EN (sau), RU (sau) | WhatsApp / email / Zalo – P7 **không có Zalo** |
| Khách thuê tháng, làm việc từ xa | P6 – Alexei | Wi-Fi, bàn làm việc, bếp, giá tháng gồm gì, điện nước tính sao, tạm trú | Nhận báo giá thuê tháng | EN, RU (sau); VI cho khách Việt | WhatsApp / Telegram [Chờ INV] / Zalo |
| Phụ: CTV, môi giới | P4 – Minh Anh | Một link đẹp để gửi khách | Chia sẻ link (Open Graph đẹp) | VI | – |

### 1.3 Không làm ở landing
- Không đăng nhập, không tài khoản khách.
- Không thanh toán (thuộc US-132, R4+).
- Giai đoạn L1 **không có form thu dữ liệu cá nhân** (tên, SĐT, email). Khách tự gửi tin qua Zalo/WhatsApp. Lý do: chưa có backend, chưa có văn bản xử lý dữ liệu cho web (Luật BVDLCN – SEC).
- Không nhúng script bên thứ ba lúc tải trang: không SDK Zalo, không iframe Google Maps, không pixel quảng cáo. Lý do: hiệu năng (LCP), quyền riêng tư, cookie.
- Không dùng logo của Booking.com, Airbnb, Agoda, Zalo (nhãn hiệu của bên khác). Chỉ dùng chữ.

## 2. Giai đoạn và vị trí trong backlog

| Giai đoạn | Nội dung | Backlog | Khi nào |
|---|---|---|---|
| **L1 – Landing giới thiệu** | Trang tĩnh. "Đặt phòng" mở ô **Hỏi phòng trống** → soạn sẵn tin nhắn → Zalo / WhatsApp / gọi | **Chưa có story** – FB-INV-001 đề xuất ORC mở ESC-020 về phạm vi; PO viết story | Đề xuất: làm cùng R3, trước US-131 |
| **L2 – Xem phòng trống + giá trực tiếp** | "Đặt phòng" mở trang đặt: phòng trống, giá trực tiếp (BR-104), gửi **yêu cầu giữ chỗ**, sale xác nhận | US-131 (Should R3) | R3 |
| **L3 – Đặt và trả tiền ngay** | Thanh toán online, không chờ người duyệt | US-132 (Could R4+) | R4+ |

- Tên miền gốc dành cho landing (`hosting-plan.md` 5.1: không trỏ tên miền gốc vào VPS app nếu dùng cho website giới thiệu). ARC/OPS quyết chỗ chạy.
- Đề xuất cho ARC: landing và trang đặt (US-131) **chung một ứng dụng** `product/apps/booking-web/` (đã có README "trang đặt phòng trực tiếp công khai, cần SEO", ADR-004 mục 3). Hai trang chung tên miền, chung ảnh, chung SEO. `00-brief/context/landing/README.md` đang ghi `product/apps/landing-web/` – cần ARC chốt một chỗ.
- Mọi nút trên landing dùng **liên kết thật** (`<a href>`): trang vẫn dùng được khi JavaScript lỗi.

## 3. Kiến trúc thông tin

### 3.1 Sơ đồ trang
```
/                 (VI – L1)
├─ #hoi-phong     Hỏi phòng trống (ô ngày + số khách)
├─ #can-ho        Căn hộ (3 kiểu căn)
├─ #o-dai-han     Ở dài hạn & làm việc từ xa
├─ #khong-gian    Không gian chung
├─ #danh-gia      Khách nói gì
├─ #vi-tri        Vị trí & đường đi
├─ #cham-soc      Đặt xong, OTTIMO lo phần còn lại (Zalo OA)
├─ #hoi-dap       Hỏi đáp
/en/  /ru/        (sau – cùng cấu trúc)
/chinh-sach-rieng-tu, /chinh-sach-huy, /noi-quy   (trang phụ – nội dung PO/DOM/SEC)
/dat-phong        (L2 – US-131; ARC chốt đường dẫn)
```

### 3.2 Thứ tự các mục (từ trên xuống)
| # | Mục | Neo | Mục đích | Persona chính | Nút |
|---|---|---|---|---|---|
| 0 | Đầu trang dính | – | Thương hiệu, điều hướng, ngôn ngữ | tất cả | Máy tính: Chat Zalo + Đặt phòng. Điện thoại: Menu |
| 1 | Hero | `#top` | Cảm xúc "ở chậm" + ảnh mặt tiền + 2 nút | tất cả | Đặt phòng · Chat Zalo |
| 2 | Hỏi phòng trống | `#hoi-phong` | Chuyển ý định thành tin nhắn có đủ ngày, số khách | P5, P7 | Hỏi phòng qua Zalo |
| 3 | Điểm nổi bật | `#diem-noi-bat` | 4 lý do chọn OTTIMO | tất cả | – |
| 4 | Căn hộ | `#can-ho` | 3 kiểu căn, ảnh, sức chứa, giá tham khảo | P5, P7 | Hỏi căn này |
| 5 | Ở dài hạn | `#o-dai-han` | Giá tháng gồm gì, điện nước, dọn, tạm trú | P6 | Nhận báo giá thuê tháng |
| 6 | Không gian chung | `#khong-gian` | Mặt tiền, sảnh, chi tiết vật liệu | tất cả | – |
| 7 | Khách nói gì | `#danh-gia` | Đánh giá **thật** từ OTA | P5, P7 | Xem thêm trên Booking.com / Airbnb (chữ) |
| 8 | Vị trí | `#vi-tri` | Địa chỉ, khoảng cách, đường đi, đậu xe | tất cả | Mở Google Maps · Chép địa chỉ |
| 9 | Đặt xong… | `#cham-soc` | Hành trình chăm sóc qua Zalo OA (5 bước) | P5, P6 | Quan tâm Zalo OA |
| 10 | Hỏi đáp | `#hoi-dap` | Trả lời trước 8–10 câu hay hỏi | tất cả | – |
| 11 | Lời mời cuối | – | Nhắc hành động | tất cả | Đặt phòng · Chat Zalo |
| 12 | Chân trang | – | Liên hệ, pháp lý, kênh | tất cả | – |
| – | Thanh dính đáy (điện thoại < 768px) | – | Nút luôn trong vùng ngón cái | tất cả | Đặt phòng · Chat Zalo |

Lý do thứ tự: khách ngắn ngày quyết theo ảnh → căn → giá → tin cậy → vị trí. Ô hỏi phòng đặt ngay sau hero để người đã sẵn sàng không phải cuộn. Mục dài hạn đứng ngay sau Căn hộ vì là nhóm doanh thu ổn định (mục tiêu 4–6 căn dài hạn – brief mục 1).

## 4. Dàn ý nội dung (VI trước, EN sau)

Giọng văn theo `content-guide.md` mục 1, cột "Khách": chủ nhà boutique, ấm, xưng "bạn", câu ≤ 20 từ, nói lợi ích trước. Không dùng thuật ngữ nội bộ (FOC, OOO, folio, "Căn N"). Con số nghiệp vụ lấy từ tham số, không viết cứng (content-guide mục 2). Cột EN chỉ khóa các câu chính; bản EN đầy đủ làm ở bước sau và phải được người dịch duyệt (HR-01).

### 4.1 Đầu trang
- Chữ thương hiệu: **OTTIMO** (Lora 600, giãn chữ 0,3em) + dòng nhỏ **BOUTIQUE STAY** – theo L-A (ESC-012). Đổi sang logo gốc khi INV gửi (L-B).
- Menu: Căn hộ · Ở dài hạn · Vị trí · Hỏi đáp.
- Ngôn ngữ: VI · EN · RU (EN/RU hiện "sắp có" tới khi có bản dịch; tên ngôn ngữ viết bằng chính ngôn ngữ đó – C28).

### 4.2 Hero
| Phần | VI | EN (khóa, viết sau) |
|---|---|---|
| Dòng nhỏ | Đà Lạt · Phường Xuân Hương | Da Lat · Xuan Huong Ward |
| Tiêu đề H1 | Ở chậm giữa Đà Lạt | Slow living in the heart of Da Lat |
| Mô tả | 10 căn hộ boutique cho vài đêm thong thả hay vài tháng sống chậm. Có bếp, góc làm việc và Wi-Fi ổn định. | – |
| Nút | Đặt phòng · Chat Zalo | Book now · Chat with us |
| Dòng sự thật | Nhận phòng 14:00 · Trả phòng 12:00 · Thuê tháng từ {monthly_from} | Check-in 14:00 · Check-out 12:00 |

- Giờ lấy từ BR-401. `{monthly_from}` lấy từ giá niêm yết tháng thấp nhất (BR-101; brief: 8,0 triệu) – **chỉ hiện khi INV đồng ý công khai giá** (câu hỏi Q3, mục 15).
- "Bếp, góc làm việc, Wi-Fi ổn định" lấy từ checklist kiểm phòng (`round-0-baseline.md`: bếp sạch, tủ lạnh, bàn làm việc có đèn và ổ cắm, Wi-Fi ≥ 50 Mbps). Có ở **mọi** căn không: [Chưa xác minh] – INV xác nhận.

### 4.3 Hỏi phòng trống (L1)
- Tiêu đề: "Hỏi phòng trống". Mô tả: "Chọn ngày, OTTIMO báo phòng và giá qua Zalo."
- Ô: Ngày nhận phòng · Ngày trả phòng · Người lớn (bộ đếm +/−) · Trẻ em dưới 12 tuổi (bộ đếm, gợi ý "Bé dưới 6 tuổi ở miễn phí" – BR-110) · Loại căn (không bắt buộc: Chưa chọn / Studio / Căn 1 phòng ngủ / Căn 2 phòng ngủ / Thuê theo tháng).
- Nút: **Hỏi phòng qua Zalo**. Dòng phụ: "Trang này không lưu thông tin bạn nhập."
- Sau khi bấm: hộp thoại hiện tin nhắn soạn sẵn (sửa được) + "Chép tin nhắn và mở Zalo" (chính), "Gửi qua WhatsApp", "Gọi lễ tân". Lý do chép: liên kết Zalo **không điền sẵn được nội dung** [Chưa xác minh]; WhatsApp điền sẵn được bằng `?text=` [Chưa xác minh – mục 17].
- Tin nhắn mẫu:
  > Chào OTTIMO, mình muốn hỏi phòng:
  > – Nhận phòng: 20/10/2026 · Trả phòng: 22/10/2026 (2 đêm)
  > – Khách: 2 người lớn, 1 trẻ em
  > – Loại căn: Studio
  > Nhờ OTTIMO báo giúp phòng trống và giá. Cảm ơn!
- Lỗi (content-guide 5.1): "Chọn ngày nhận phòng." · "Ngày nhận phòng cần từ hôm nay trở đi." · "Ngày trả phòng cần sau ngày nhận phòng. Ví dụ: nhận 20/10, trả 22/10."
- Trên 5 khách (sức chứa tối đa căn lớn nhất – BR-110): không chặn, hiện "Đoàn trên 5 người? Cứ gửi – OTTIMO sẽ gợi ý đặt nhiều căn."
- L2: ô này thành "Xem phòng trống" → trang đặt (US-131).

### 4.4 Điểm nổi bật
- Dòng nhỏ "Vì sao chọn OTTIMO" · H2 "Chậm lại, như ở nhà".
- 4 ý (icon nét + tiêu đề + 1 câu):
  1. **Như ở nhà** – Bếp riêng, tủ lạnh, đồ dùng đủ cho ở lâu. [Chưa xác minh từng căn]
  2. **Làm việc thoải mái** – Bàn làm việc có đèn, ổ cắm, Wi-Fi từ 50 Mbps. [Chưa xác minh – số đo thật]
  3. **Ấm giữa trời se lạnh** – Nước nóng ổn định, chăn dày, sưởi/điều hòa. [Chưa xác minh từng căn]
  4. **Nhận phòng nhẹ nhàng** – Làm thủ tục online trước, đến nơi chỉ vài phút. (Đã có: check-in online R2.)

### 4.5 Căn hộ
- Dòng nhỏ "Căn hộ" · H2 "Ba kiểu căn cho mỗi nhịp sống" · mô tả "10 căn, mỗi căn một tên riêng. Chọn kiểu căn hợp với số người và thời gian bạn ở."
- Tên kiểu căn công khai (UXD đặt, PO/DOM duyệt): không dùng "Lầu 1–2 / Căn N / Căn N+" (tên nội bộ).

| Thẻ | Căn (tên riêng) | Giường | Khách | Ghi chú | Giá tham khảo |
|---|---|---|---|---|---|
| **Studio** | 6 căn: The Amber, The Fern, The Bloom, The Mist, The Valley, The Sage (lầu 1–2) | 1 giường lớn | 2 khách · tối đa 3 (người thứ 3 ngủ sofa lớn) | Phù hợp cặp đôi, một người làm việc từ xa | Tháng từ {studio_monthly_from} (brief: 8,0–9,5 tr) [Chờ INV – Q3] |
| **Căn 1 phòng ngủ** | 2 căn: The Ivory, The Ember (lầu 3–4) | 1 giường lớn + 1 giường 1m4 | 3 khách · tối đa 4 | Gia đình nhỏ, nhóm bạn 3 người | Tháng từ {onebr_monthly_from} (11,0–12,0 tr) |
| **Căn 2 phòng ngủ** | 2 căn: The Velvet, The Pine (lầu 3–4) | 2 giường lớn, 2 phòng ngủ riêng | 4 khách · tối đa 5 | Gia đình có ông bà, hai cặp đôi | Tháng từ {twobr_monthly_from} (11,5–12,5 tr) |

- Nguồn sức chứa: BR-110 (định mức, tối đa = định mức + 1, ngủ sofa – ESC-014). Tầng của 301–402 suy từ số căn [Chưa xác minh]; **thang máy** [Chờ INV] – quan trọng với người lớn tuổi (P5).
- Diện tích (`areaM2` có trong danh mục căn H04) – hiện khi INV nhập số thật.
- Giá theo đêm: L1 **không hiện số**, ghi "Giá theo ngày: hỏi để có giá trực tiếp". Lý do: giá đêm đổi theo lịch (BR-104), và có thể vướng điều khoản ngang giá với OTA [Chưa xác minh] – xem Q3.
- Mỗi thẻ: dải ảnh vuốt ngang (5–7 ảnh), bộ đếm "Ảnh 1/7", nút "Hỏi căn này" (điền sẵn loại căn vào ô Hỏi phòng).

### 4.6 Ở dài hạn & làm việc từ xa
- Dòng nhỏ "Ở dài hạn" · H2 "Sống ở Đà Lạt theo tháng".
- Mô tả: "Một căn hộ đủ tiện nghi, một hóa đơn dễ hiểu. Phù hợp người làm việc từ xa và gia đình ở lâu."
- Danh sách:
  - Giá tháng là tiền thuê căn; giảm theo kỳ hạn – hỏi để nhận báo giá. (Không công bố % giảm và phụ thu theo quốc tịch – chính sách nội bộ, chỉ nêu trong báo giá – BR-203.)
  - Điện, nước tính theo công tơ: {electricity_price}/kWh, {water_price}/m³ (brief: 3.500 đ, 25.000 đ). Ảnh chỉ số mỗi kỳ – **R3** (M11), chỉ hứa khi đã có.
  - Dọn phòng khi bạn cần: {cleaning_fee}/lần (BR-506; brief: 100.000 đ).
  - OTTIMO khai báo tạm trú cho bạn, nhắc trước khi thị thực hết hạn (BR-605). [nhắc thị thực: theo tiến độ R3]
  - Hợp đồng rõ ràng, có bản tiếng Anh [Chưa xác minh – M8 xuất PDF HĐ ở R3; ngôn ngữ HĐ chưa chốt].
- Nút (trên dải màu): **Nhận báo giá thuê tháng** → hộp thoại tin nhắn soạn sẵn ("Chào OTTIMO, mình muốn thuê theo tháng từ … trong khoảng … tháng, … người…").
- Ô ảnh LONG-01: góc làm việc ánh sáng ngày.

### 4.7 Không gian chung
- H2 "Không gian chung" · mô tả 1 câu về vật liệu (gỗ, kem, ánh sáng ấm) – viết lại khi có ảnh thật.
- Lưới 5 ảnh (SPACE-01…05) từ thư mục "Mặt tiền + Sảnh".

### 4.8 Khách nói gì
- H2 "Khách nói gì về OTTIMO".
- 3 thẻ trích **nguyên văn đánh giá thật** (tên viết tắt, quốc gia, kênh, tháng/năm). INV chọn đánh giá; dịch thì ghi "Dịch từ tiếng …".
- **Không bịa đánh giá, không sửa ý.** Không đưa điểm sao vào dữ liệu có cấu trúc (mục 9) khi chưa có nguồn hợp lệ.
- Liên kết chữ: "Xem thêm trên Booking.com · Airbnb · Agoda" [Chờ INV – link trang OTA].

### 4.9 Vị trí
- H2 "Giữa phố, vẫn yên" [Chưa xác minh – đúng thực tế không]. Mô tả 1 câu.
- Địa chỉ đầy đủ [Chờ INV] – sau sắp xếp đơn vị hành chính 2025, chuỗi địa chỉ cần INV xác nhận (phường Xuân Hương – Đà Lạt, tỉnh Lâm Đồng) [Chưa xác minh].
- Khoảng cách tới: Hồ Xuân Hương, Chợ Đà Lạt, Quảng trường Lâm Viên, Sân bay Liên Khương – ghi "{n} phút đi bộ / lái xe" [Chờ INV hoặc đội đo khi có địa chỉ].
- Đậu xe ô tô / xe máy [Chờ INV] (P5 cần).
- Nút: **Mở Google Maps** (liên kết chỉ đường `https://www.google.com/maps/dir/?api=1&destination=…` [Nguồn]) · **Chép địa chỉ**.
- Bản đồ: hình tĩnh UXD vẽ (SVG nhẹ) hoặc ảnh chụp bản đồ có ghi nguồn – **không nhúng iframe** Google Maps.
- **Một nguồn dữ liệu**: địa chỉ, tọa độ, hướng dẫn đường đi dùng chung với trang khách `g.` (US-108 AC1). Sửa một chỗ.

### 4.10 Đặt xong, OTTIMO lo phần còn lại (Zalo OA)
- H2 "Đặt xong, OTTIMO lo phần còn lại" · mô tả "Mọi tin quan trọng đến qua Zalo – bạn không cần cài thêm ứng dụng."
- 5 bước:
  1. **Xác nhận đặt phòng** – tin xác nhận gửi qua Zalo (hoặc email, WhatsApp).
  2. **Làm thủ tục trước** – gửi giấy tờ và giờ đến qua link riêng, khoảng 2 phút.
  3. **Nhắc trước ngày đến** – kèm vị trí, đường đi, chỗ đậu xe.
  4. **Trong lúc ở** – cần khăn, dọn phòng, sửa gì, nhắn OTTIMO hoặc gửi trên trang lưu trú.
  5. **Sau khi trả phòng** – lời cảm ơn và ưu đãi cho lần sau.
- Thẻ bên cạnh: QR Zalo OA + nút **Quan tâm Zalo OA** + dòng "Khách nước ngoài: WhatsApp {whatsapp}".
- Câu chữ phải **đúng với việc đội làm được**: bước 1–3 hiện do lễ tân gửi tay (R2) – câu trên vẫn đúng vì không hứa "tự động". Bước 5 phụ thuộc US-116 (R3) và chính sách ưu đãi – ẩn cho tới khi có. Chi tiết điểm chạm ở mục 11.

### 4.11 Hỏi đáp (mở/đóng từng câu)
| Câu hỏi | Nguồn trả lời |
|---|---|
| Giờ nhận và trả phòng? | BR-401 (14:00 / 12:00) |
| Nhận sớm, trả muộn được không? | BR-411/BR-416 – "Tùy phòng trống, có phụ thu theo giờ. Báo trước để OTTIMO giữ cho bạn." |
| Đặt cọc thế nào? | BR-305 (cọc {deposit_pct} tiền phòng, chuyển khoản VietQR) |
| Hủy phòng thế nào? | `cancel_policy_direct` (ESC-006 "linh hoạt vừa") – PO/DOM viết, link trang Chính sách hủy |
| Trẻ em, thêm người? | BR-110 (dưới 6 tuổi miễn phí; người thêm ngủ sofa, có phụ thu) |
| Có hút thuốc được không? | Nội quy: chỉ ở ban công; phí khử mùi theo nội quy (brief mục 5) |
| Thanh toán bằng gì? | Chuyển khoản/VietQR, tiền mặt; thẻ quốc tế qua VNPay (R3 – ESC-010). Không nhận tiền mã hóa (BR-527) |
| Cần giấy tờ gì? | CCCD (khách Việt), hộ chiếu + thị thực (khách nước ngoài) – để khai báo lưu trú theo quy định |
| Có thang máy, chỗ đậu xe, nhận thú cưng không? | [Chờ INV] |
| Đến muộn sau 22:00 thì sao? | Làm thủ tục online trước; có người trực đêm (ESC-010 T-A, BR-611) |

### 4.12 Lời mời cuối
- H2 "Sẵn sàng cho vài ngày chậm lại?" · nút Đặt phòng · Chat Zalo.

### 4.13 Chân trang
- Chữ thương hiệu, địa chỉ, hotline, Zalo OA, email, giờ trực lễ tân **07:00–22:00** (BR-811) + "Người trực đêm tại chỗ".
- Liên kết: Chính sách quyền riêng tư · Chính sách hủy · Nội quy.
- Thông tin doanh nghiệp (tên đăng ký, mã số thuế, địa chỉ) [Chờ INV – ESC-008 loại hình kinh doanh] và mục thông báo website TMĐT nếu bắt buộc (mục 13).
- Liên kết chữ tới trang OTA và Google Maps.

## 5. Hướng hình ảnh

### 5.1 Dung hòa Design System và e-brochure
- Design System (D1): kem giấy, chữ than, nhấn gỗ sồi, Lora + Be Vietnam Pro. App, bill, trang khách `g.` đều dùng.
- E-brochure: tên file "OTTIMO_Ebrochure_16x9_Terracotta_C1_SlowLiving.pdf" gợi ý **đất nung (terracotta)** và tinh thần **"Slow Living"**. **[Chưa xác minh]** – chưa đọc được file; có thể "Terracotta" chỉ là tên một phương án trong nhiều phương án (C1).
- Nguyên tắc: khách đi từ landing → tin Zalo → trang khách `g.` → bill. **Ba chỗ phải trông như một thương hiệu.** Vì vậy landing không được lệch xa Design System nếu chưa có quyết định thương hiệu.
- "Slow living" dùng được ngay mà không đổi màu: nhiều khoảng trắng, ảnh lớn, chữ serif to, nhịp cuộn chậm, câu ngắn, không banner khuyến mãi nhấp nháy.

### 5.2 Hướng A (đề xuất) – "Kem – sồi, chạm đất nung"
- Nền, chữ, nút: giữ nguyên token Design System. Nút chính nền `--ink` (than), giống app.
- Thêm họ màu **đất nung** chỉ cho trang trí: vạch nhấn dưới tiêu đề, số bước, dấu ngoặc trích dẫn, viền ô ảnh nhỏ, nền dải "Lời mời cuối" (`--clay-soft`).
- Dải "Ở dài hạn" nền than `--band` để đổi nhịp.
- Hợp khi: e-brochure chưa xác nhận, hoặc đất nung chỉ là màu chiến dịch.

### 5.3 Biến thể B – "Đất nung dẫn dắt"
- Nút chính nền `--clay-ink`, chữ kem. Dòng nhỏ, link nhấn dùng `--clay-ink`. Dải "Ở dài hạn" nền đất nung đậm `--clay-deep`.
- Gỗ sồi lùi về vai trò đường kẻ, viền.
- Hợp khi: e-brochure xác nhận đất nung là màu thương hiệu chính. Khi đó app khách `g.` và mẫu tin cũng nên chuyển theo (một quyết định thương hiệu, không chỉ landing) → **INV quyết (Q1)**.
- Mock có công tắc A/B để INV so sánh.

### 5.4 Token mới (chỉ landing, đề xuất thêm vào `tokens.json` khi chốt)
Đo theo công thức WCAG 2.2 (script trong phiên làm việc UXD, cùng công thức `gen_tokens.py`). Chữ ≥ 4,5:1; thành phần UI ≥ 3:1.

| Token | Sáng | Tối | Dùng cho | Cặp đo (sáng / tối) |
|---|---|---|---|---|
| `--clay` | `#B85F3A` | `#D98A62` | Trang trí, vạch nhấn, viền UI | trên `--bg` 3,90:1 / 6,43:1 (UI ≥ 3:1 ĐẠT); **cấm cho chữ nhỏ** ở nền sáng |
| `--clay-ink` | `#9C4A2B` | `#E8A27F` | Chữ/link màu đất nung; nền nút chính ở biến thể B | trên `--bg` 5,39 / 8,20; trên `--surface` 5,82 / 7,48; trên `--clay-soft` 4,86 / 6,43 – ĐẠT |
| `--clay-soft` | `#F3E2D7` | `#3B2A22` | Nền nhấn nhẹ (dải lời mời cuối) | `--ink` trên nó 11,24 / 11,17; `--muted` 5,04 / 5,44 – ĐẠT |
| `--clay-deep` | `#7E3B22` | (dùng `#3B2A22`) | Nền dải ở biến thể B | `--bg` trên nó 7,29; `--oak-soft` 6,76 – ĐẠT |
| `--band` / `--band-t` | `#2F2D2A` / `#F4F0E8` | `#2D2A26` / `#EDE8DF` | Dải "Ở dài hạn" (hướng A) | 12,08 / 11,70 – ĐẠT |
| `--band-muted` | `#C8C0B2` | `#A9A398` | Chữ phụ trên dải | 7,61 / 5,70 – ĐẠT |
| `--band-accent` | `#D9B987` | `#D9B987` | Dòng nhỏ, viền focus trên dải | 7,35 / 7,64 – ĐẠT |
| Nút B: chữ `#FBF9F4` trên `--clay-ink` | – | chữ `#1B1A18` trên `#E8A27F` | Nút chính biến thể B | 5,82 / 8,20 – ĐẠT |
| Focus `--focus` trên `--clay-soft` | `#7A5C2E` | `#D9B987` | Viền focus trong dải lời mời | 4,91 / 7,30 – ĐẠT (≥ 3:1) |

Kết quả: **0 cặp không đạt**. Khi chốt hướng, UXD thêm token vào `gen_tokens.py` và chạy lại kiểm tương phản.

### 5.5 Chữ (landing)
| Vai trò | Font | Điện thoại → máy tính | Ghi chú |
|---|---|---|---|
| Hero H1 | Lora 600 (chữ nghiêng 500 cho 1 từ nhấn) | 36 → 56px, dòng 1,1 | `clamp()`; từ "Đà Lạt" nghiêng tạo chất "slow" |
| H2 mục | Lora 600 | 28 → 40px, dòng 1,2 | |
| H3 thẻ | Lora 600 | 20 → 22px | |
| Dòng nhỏ (eyebrow) | Be Vietnam Pro 600, chữ hoa, giãn 0,14em | 14px | Màu `--accent-ink` (A: `--oak-ink`, B: `--clay-ink`) |
| Thân | Be Vietnam Pro 400 | 16 → 17px, dòng 1,6 | Đoạn dẫn 18 → 20px |
| Chú thích | Be Vietnam Pro 400 | 14px | Tối thiểu điện thoại (DS mục 3) |

- Tự host font (OFL 1.1), woff2, `font-display: swap`, subset `latin`, `latin-ext`, `vietnamese` (+ `cyrillic` cho Lora ở trang RU). Mock dùng Google Fonts cho tiện.
- Đơn vị `rem`. Phóng 200% không vỡ.

### 5.6 Bố cục, khoảng cách, chuyển động
- Lưới 4px của DS. Thêm 2 khoảng lớn cho landing: **80px**, **96px** (khoảng cách mục trên máy tính). Điện thoại: 64px giữa mục.
- Khung nội dung tối đa 1200px; lề 16px (điện thoại), 24px (máy tính bảng), 32px (máy tính).
- Bo góc: ảnh 16px (máy tính) / 12px (điện thoại); thẻ 12px; nút 8px; chip 999px – theo DS mục 4.
- Chuyển động: chỉ mờ dần/trượt nhẹ 280ms `cubic-bezier(.2,0,0,1)` khi ảnh vào khung. **Không parallax, không tự chạy slide, không video tự phát.** `prefers-reduced-motion` → 0ms.

### 5.7 Chỉ đạo ảnh (khi chọn từ Drive hoặc chụp thêm)
- Ánh sáng tự nhiên, tông ấm, không HDR gắt, không méo góc rộng quá 24mm (tương đương).
- Ưu tiên chi tiết "sống chậm": tách cà phê, chăn len, ánh nắng trên sàn gỗ, cửa sổ nhìn cây thông.
- Phòng gọn, giường phẳng, không đồ cá nhân, không thấy mặt người lạ (nếu có người: quay lưng/xa, có giấy đồng ý).
- Tránh chữ trong ảnh (không dịch được – content-guide 6).

## 6. Ô ảnh (image slots)

Thư mục Drive "OTTIMO BOUTIQUE STAY" (INV): "Mặt tiền + Sảnh" (6 PNG), "Phòng 1"…"Phòng 5" (~7 PNG mỗi thư mục). **Chưa biết "Phòng 1–5" ứng với căn nào** → INV ánh xạ (Q2). Mock đặt ô theo kiểu căn, không theo thư mục.

| Mã ô | Mục | Thư mục Drive | Loại ảnh cần | Khung | Số ảnh | Alt mẫu (VI) | Ưu tiên |
|---|---|---|---|---|---|---|---|
| HERO-01 | Hero (ảnh LCP) | Mặt tiền + Sảnh | Mặt tiền chéo 3/4, nắng chiều, thấy lối vào và biển tên | 4:3 điện thoại · 4:5 máy tính (cắt khác nhau) | 1 | Mặt tiền OTTIMO Boutique Stay lúc chiều, tường kem và cửa gỗ | P0 |
| HERO-02 | Hero (ảnh phụ chồng) | Mặt tiền + Sảnh | Chi tiết sảnh: ghế, đèn, gỗ | 1:1 | 1 | Góc sảnh với ghế gỗ sồi và đèn vàng ấm | P1 |
| ROOM-S-01…07 | Căn hộ – Studio | Phòng ⟨?⟩ [Chờ INV] | Toàn cảnh giường; góc bếp; bàn làm việc; phòng tắm; cửa sổ/view; chi tiết trang trí | 4:3 | 5–7 | Studio The Sage: giường lớn cạnh cửa sổ | P0 |
| ROOM-1BR-01…07 | Căn hộ – Căn 1 phòng ngủ | Phòng ⟨?⟩ | Phòng ngủ chính; giường 1m4; phòng khách + sofa; bếp; phòng tắm | 4:3 | 5–7 | Căn 1 phòng ngủ The Ivory: phòng khách với sofa lớn | P0 |
| ROOM-2BR-01…07 | Căn hộ – Căn 2 phòng ngủ | Phòng ⟨?⟩ | Hai phòng ngủ; phòng khách; bếp; phòng tắm; ban công | 4:3 | 5–7 | Căn 2 phòng ngủ The Pine: phòng ngủ thứ hai | P0 |
| LONG-01 | Ở dài hạn | Phòng ⟨?⟩ | Bàn làm việc, ánh sáng ngày, laptop (không lộ màn hình) | 4:5 | 1 | Bàn làm việc gỗ cạnh cửa sổ trong căn hộ | P1 |
| SPACE-01…05 | Không gian chung | Mặt tiền + Sảnh | Sảnh rộng; lối vào; cầu thang/hành lang; chi tiết vật liệu; mặt tiền buổi tối | 3:2, 1:1, 4:5 (lưới) | 5 | Sảnh OTTIMO với quầy gỗ và cây xanh | P1 |
| MAP-01 | Vị trí | – (UXD vẽ) | Bản đồ tối giản SVG: điểm OTTIMO + 3–4 mốc | 16:10 | 1 | Bản đồ: OTTIMO cách Hồ Xuân Hương {n} phút đi bộ | P1 |
| ZALO-QR | Đặt xong… / hộp chat | – (xuất từ trang quản trị Zalo OA) | Mã QR của OA | 1:1 | 1 | Mã QR Zalo OA OTTIMO | P1 |
| OG-01 | Chia sẻ link | Cắt từ HERO-01 | 1200×630, có chữ OTTIMO nhỏ góc dưới | 1,91:1 | 1 | Mặt tiền OTTIMO Boutique Stay, Đà Lạt | P0 |

**Ảnh còn thiếu (đề xuất chụp bổ sung, Q2):** view từ cửa sổ/ban công; quanh khu (hồ, chợ, đường đi bộ); ban công (nơi được hút thuốc); chỗ đậu xe; lối vào ban đêm (khách đến muộn); ảnh "sống chậm" có người (tùy chọn, cần giấy đồng ý).

## 7. Đường ống ảnh và hiệu năng

### 7.1 Mục tiêu
| Chỉ số | Đích | Điều kiện đo |
|---|---|---|
| LCP | ≤ 2,5 giây ở phân vị 75 [Nguồn: web.dev] | Đo thực tế (field) sau khi chạy thật |
| LCP lab | ≤ 2,0 giây | Lighthouse điện thoại, "Slow 4G" = RTT 150ms, 1,6 Mbps xuống, CPU chậm 4 lần [Nguồn] |
| CLS | ≤ 0,1 | |
| INP | ≤ 200ms | |
| JS trang | ≤ 30 KB (nén) | Không thư viện khung lớn cho L1 |
| Tải màn đầu | ≤ 350 KB | HTML + CSS quan trọng + 2 font + ảnh hero |
| Toàn trang khi cuộn hết | ≤ 2,5 MB | Ảnh dưới màn đầu tải lười |

Tính nhẩm: 1,6 Mbps ≈ 200 KB/giây. HTML ~25 KB (CSS quan trọng nội tuyến) + kết nối (~3 RTT ≈ 0,45 giây) + ảnh hero ~120 KB (~0,6 giây, tải song song nhờ preload) + font ~50 KB → LCP lab ~1,5–2,0 giây. Đủ biên cho 2,5 giây.

### 7.2 Định dạng và cỡ
- Gốc: PNG 4–60 MB (~0,9–1 GB). **Không đưa ảnh gốc vào git** (`00-brief/context/landing/README.md`). Chỉ bản đã tối ưu vào thư mục ứng dụng.
- Xuất: **AVIF** (chất lượng ~50) + **WebP** (~75) + **JPEG** dự phòng (~78) qua `<picture>`. AVIF hỗ trợ ~96% trình duyệt, Safari iOS từ 16 [Nguồn: caniuse].
- Chuyển hồ sơ màu về sRGB. **Xóa toàn bộ metadata** (EXIF, GPS, số máy).
- Cỡ (bề ngang, px):

| Loại | Cỡ xuất | Ngân sách (AVIF) |
|---|---|---|
| Hero | 640 · 960 · 1280 · 1920 | 960w ≤ 120 KB; 1920w ≤ 260 KB |
| Ảnh căn, không gian | 480 · 800 · 1200 · 1600 | 800w ≤ 90 KB |
| Ảnh phụ (HERO-02, LONG-01) | 400 · 800 | 800w ≤ 70 KB |
| OG-01 | 1200×630 JPEG | ≤ 300 KB (JPEG để Zalo/Facebook đọc chắc chắn – [Chưa xác minh] Zalo đọc WebP/AVIF) |

- Tên tệp: `{slot}-{w}.{avif|webp|jpg}` có mã băm nội dung (`hero-01-960.3f2a.avif`) để cache 1 năm.
- Ảnh hero cắt khác nhau theo màn (art direction): `<source media="(min-width: 1024px)">` dùng khung 4:5.

### 7.3 Quy tắc tải
- Ảnh hero: `<link rel="preload" as="image" imagesrcset imagesizes>`, `fetchpriority="high"`, **không** `loading="lazy"`.
- Ảnh khác: `loading="lazy"`, `decoding="async"`.
- Mọi ảnh có `width`/`height` (hoặc `aspect-ratio`) → không xô lệch bố cục.
- Nền tạm khi ảnh chưa tới: màu `--surface-2` (không dùng ảnh mờ base64 để tiết kiệm byte).
- Font: tự host, preload **chỉ** Lora 600 (tiêu đề hero); font dự phòng chỉnh `size-adjust` để giảm xô lệch.
- Không script bên thứ ba lúc tải. Đo lường (nếu có) chạy sau `load`, công cụ không cookie (DATA chọn).
- Máy chủ: nén br/gzip; ảnh và tệp có mã băm `Cache-Control: public, max-age=31536000, immutable`; HTML `no-cache`; HTTP/2 trở lên (OPS).

### 7.4 Công cụ
- Đề xuất: script Node dùng `sharp` (đã có trong repo, 0.35.5) đọc bảng ô ảnh ở mục 6 → sinh mọi cỡ + định dạng + bảng `srcset`. ARC/FE chốt nơi đặt script.
- CI: Lighthouse CI chế độ điện thoại, chặn merge khi LCP lab > 2,0 giây hoặc CLS > 0,1 (OPS).

## 8. Truy cập (WCAG 2.2 AA)

Áp toàn bộ DS mục 8. Bổ sung riêng cho landing:

| # | Quy tắc | Tiêu chí |
|---|---|---|
| L-A1 | Chữ **không đặt trực tiếp trên ảnh**. Hero: điện thoại – ảnh trên, chữ dưới trên nền kem; máy tính – chữ ở cột riêng | 1.4.3 |
| L-A2 | Mỗi ô ảnh có alt VI/EN mô tả nội dung; ảnh trang trí `alt=""` | 1.1.1 |
| L-A3 | Dải ảnh căn: **không tự chạy**; vuốt, cuộn bằng bàn phím, nút Trước/Sau có `aria-label`; bộ đếm "Ảnh 2/7" `aria-live="polite"` | 2.2.2, 2.1.1 |
| L-A4 | Hộp thoại dùng `<dialog>` gốc: focus vào tiêu đề, Esc đóng, trả focus về nút gọi | 2.4.3 |
| L-A5 | Ô nhập có nhãn luôn hiện; lỗi gắn `aria-describedby` + `aria-invalid`; bộ đếm khách là `button` thật + `output aria-live` (C4) | 3.3.1, 4.1.2 |
| L-A6 | Đầu trang và thanh dính đáy **không che** phần tử đang focus (`scroll-padding-top/bottom`) | 2.4.11 |
| L-A7 | Vùng chạm ≥ 44×44px; nút chính và nút thanh đáy ≥ 48px | 2.5.8 |
| L-A8 | Một H1; H2 cho từng mục; landmark `header`, `nav`, `main`, `footer`; link "Bỏ qua tới nội dung" | 1.3.1, 2.4.1 |
| L-A9 | `<html lang="vi">`; tên ngôn ngữ trong bộ chọn gắn `lang` riêng ("English" `lang="en"`) | 3.1.1, 3.1.2 |
| L-A10 | Link mở tab mới ghi rõ "(mở tab mới)" cho trình đọc màn hình | 2.4.4 |
| L-A11 | Không cuộn ngang ở 320px; phóng chữ 200% không mất nội dung | 1.4.10, 1.4.4 |
| L-A12 | Tôn trọng `prefers-reduced-motion`; không nhấp nháy | 2.3.3 |
| L-A13 | Trạng thái không chỉ bằng màu (chip "chờ INV" có chữ + viền đứt) | 1.4.1 |
| L-A14 | Hỏi đáp dùng `<details>/<summary>` – bàn phím và trình đọc màn hình dùng sẵn | 4.1.2 |

Kiểm trước khi nộp (UXD + QA): bàn phím từ đầu tới cuối trang; VoiceOver (iOS) và TalkBack (Android); 320px; phóng 200%; sáng/tối; mô phỏng mù màu.

## 9. SEO và Open Graph

### 9.1 Thẻ đầu trang (bản VI)
```html
<html lang="vi">
<title>OTTIMO Boutique Stay Đà Lạt – Căn hộ ở ngắn ngày và theo tháng</title>
<meta name="description" content="10 căn hộ boutique ở phường Xuân Hương, Đà Lạt. Có bếp, góc làm việc, Wi-Fi ổn định. Ở vài đêm hay thuê theo tháng – hỏi phòng nhanh qua Zalo.">
<link rel="canonical" href="https://{domain}/">
<link rel="alternate" hreflang="vi" href="https://{domain}/">
<link rel="alternate" hreflang="en" href="https://{domain}/en/">
<link rel="alternate" hreflang="ru" href="https://{domain}/ru/">
<link rel="alternate" hreflang="x-default" href="https://{domain}/en/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="OTTIMO Boutique Stay">
<meta property="og:title" content="OTTIMO Boutique Stay – Ở chậm giữa Đà Lạt">
<meta property="og:description" content="10 căn hộ boutique cho vài đêm hay vài tháng. Hỏi phòng qua Zalo.">
<meta property="og:url" content="https://{domain}/">
<meta property="og:image" content="https://{domain}/og/og-01.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Mặt tiền OTTIMO Boutique Stay, Đà Lạt">
<meta property="og:locale" content="vi_VN">
<meta property="og:locale:alternate" content="en_US">
<meta property="og:locale:alternate" content="ru_RU">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F4F0E8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1B1A18" media="(prefers-color-scheme: dark)">
```
- 4 thuộc tính OG bắt buộc: `og:title`, `og:type`, `og:image`, `og:url`; có `og:image` thì nên có `og:image:alt` [Nguồn: ogp.me].
- `hreflang` EN/RU chỉ thêm khi trang đó **đã có**. `x-default` trỏ EN khi có, trước đó trỏ VI.
- Zalo hiển thị xem trước link theo thẻ OG [Chưa xác minh] – QA thử bằng cách gửi link trong Zalo sau khi chạy thật.

### 9.2 Dữ liệu có cấu trúc (JSON-LD)
Loại `LodgingBusiness` (có `checkinTime`, `checkoutTime`, `numberOfRooms`, `amenityFeature`, `availableLanguage`; `address`, `geo`, `telephone`, `sameAs` kế thừa – [Nguồn: schema.org]). Không thêm `aggregateRating` khi chưa có nguồn hợp lệ.
```json
{
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  "name": "OTTIMO Boutique Stay",
  "url": "https://{domain}/",
  "image": ["https://{domain}/og/og-01.jpg"],
  "address": {"@type": "PostalAddress", "streetAddress": "{street}", "addressLocality": "Đà Lạt", "addressRegion": "Lâm Đồng", "addressCountry": "VN"},
  "geo": {"@type": "GeoCoordinates", "latitude": "{lat}", "longitude": "{lng}"},
  "telephone": "{hotline_e164}",
  "checkinTime": "14:00", "checkoutTime": "12:00",
  "numberOfRooms": 10,
  "availableLanguage": ["vi", "en", "ru"],
  "amenityFeature": [
    {"@type": "LocationFeatureSpecification", "name": "Wi-Fi", "value": true},
    {"@type": "LocationFeatureSpecification", "name": "Bếp riêng", "value": true},
    {"@type": "LocationFeatureSpecification", "name": "Bàn làm việc", "value": true}
  ],
  "sameAs": ["{zalo_oa_url}", "{google_maps_url}", "{booking_url}", "{airbnb_url}"]
}
```
`amenityFeature` chỉ ghi khi INV xác nhận (mục 4.4).

### 9.3 Khác
- URL: `/` (VI), `/en/`, `/ru/`; neo mục bằng chữ không dấu (`#can-ho`, `#vi-tri`).
- `robots.txt` cho phép tên miền gốc; `sitemap.xml` có `hreflang`.
- **`desk.`, `staff.`, `g.` và mọi `staging-*`**: gửi `X-Robots-Tag: noindex, nofollow` (trang khách `g.` có dữ liệu đơn) – đề nghị OPS thêm vào Caddyfile (hiện `hosting-plan.md` 5.1 mới ghi cho staging).
- Tên – địa chỉ – SĐT viết **giống hệt** ở landing, Google Maps, trang OTA (INV kiểm hồ sơ Google Maps [Chưa xác minh đã có]).

## 10. Hai nút "Đặt phòng" và "Chat Zalo"

### 10.1 Vị trí
| Vị trí | Điện thoại | Máy tính |
|---|---|---|
| Đầu trang | Chỉ nút Menu; bộ chọn ngôn ngữ nằm trong menu (tránh trùng với thanh đáy) | Chat Zalo (nút viền) + Đặt phòng (nút chính) |
| Hero | Đặt phòng (chính) + Chat Zalo (phụ), cao 48px | như điện thoại, cao 48px |
| Thẻ căn | Hỏi căn này (phụ) | như điện thoại |
| Ở dài hạn | Nhận báo giá thuê tháng (nút đảo màu trên dải) | như điện thoại |
| Đặt xong… | Quan tâm Zalo OA | + QR |
| Lời mời cuối | Đặt phòng + Chat Zalo | như điện thoại |
| **Thanh dính đáy** | Đặt phòng + Chat Zalo, luôn hiện, cao 48px, ẩn khi hộp thoại mở | Không có |

Mỗi vùng tối đa **1 nút chính** (C1).

### 10.2 Hành vi theo giai đoạn
| Nút | L1 | L2 (US-131) | L3 (US-132) |
|---|---|---|---|
| **Đặt phòng** | Cuộn tới **Hỏi phòng trống** (`#hoi-phong`) → soạn tin → Zalo / WhatsApp / gọi | Mở trang đặt: phòng trống + giá trực tiếp → gửi yêu cầu giữ chỗ (sale xác nhận, BR-30x). Form có thông báo xử lý dữ liệu + đồng ý (SEC) | Đặt + trả tiền ngay |
| **Chat Zalo** | Điện thoại: mở thẳng Zalo OA (`https://zalo.me/{oa_id}` [Chưa xác minh định dạng]). Máy tính: hộp thoại có QR OA + link + kênh khác | như L1 | như L1 |
| (trang EN/RU) **Chat with us** | Hộp thoại chọn kênh: WhatsApp (`https://wa.me/{số}` [Chưa xác minh]), Telegram [Chờ INV], Zalo, email | như L1 | như L1 |

- Trước khi có OA: dùng Zalo của số hotline OTTIMO (đúng ý INV là OA, nên chỉ tạm) [Chờ INV].
- Không dùng widget chat Zalo nhúng (script bên thứ ba): chậm, đặt cookie, khó kiểm truy cập [Chưa xác minh chi tiết widget – tài liệu Zalo không tải được khi tra].
- Chép tin nhắn: thành công → "Đã chép tin nhắn. Mở Zalo và dán vào ô chat." (`role="status"`). Không chép được → chọn sẵn chữ + "Chưa chép tự động được. Chạm giữ vào tin nhắn rồi chọn Sao chép."

### 10.3 Chữ trên nút
| VI | EN | Ghi chú |
|---|---|---|
| Đặt phòng | Book now | Nút chính |
| Chat Zalo | Chat with us | EN không giả định khách có Zalo |
| Hỏi phòng qua Zalo | Ask about availability | Nút gửi ô Hỏi phòng |
| Hỏi căn này | Ask about this room | Thẻ căn |
| Nhận báo giá thuê tháng | Get a monthly quote | Dài hạn |
| Quan tâm Zalo OA | Follow us on Zalo | |
| Mở Google Maps | Open in Google Maps | |
| Chép địa chỉ | Copy address | |

### 10.4 Đo lường (gợi ý cho DATA, không cookie, không dữ liệu cá nhân)
`lp_cta_book` · `lp_cta_chat` (kèm vị trí nút) · `lp_enquiry_open` · `lp_enquiry_copy` (kèm kênh) · `lp_room_ask` (kiểu căn) · `lp_longstay_quote` · `lp_map_open` · `lp_lang_switch`. Không gửi ngày, số khách, nội dung tin nhắn.

## 11. Liên kết với Zalo OA – các điểm chạm

INV 17/10 muốn dùng Zalo OA để chăm khách: gửi check-in online, nhắc ngày nhận phòng, gửi vị trí, kênh tương tác. Bảng dưới để PO/INT tham chiếu; **quyết định đổi ESC-010 (ZNS để sau MVP) thuộc ORC/PO/INT**, không thuộc UXD.

| Điểm chạm | R2 hiện tại | Kế hoạch | Phần của landing / UXD |
|---|---|---|---|
| Hỏi phòng, tư vấn | Zalo/nhóm chat, sale trả lời tay | OA chat 2 chiều (I7 `zalo_oa`) | Nút Chat Zalo, tin soạn sẵn |
| Xác nhận đặt + link check-in online | Lễ tân chép link ở GuestLinkPanel, dán vào Zalo/OTA | US-126 (R3): tự gửi qua ZNS/OA | Bước 1–2 mục 4.10; mẫu `msg.booking_confirmed`, `msg.checkin_link` (content-guide 7) |
| **Nhắc ngày nhận phòng + vị trí** | Không có | **Chưa có story** – US-034 chỉ nhắc **trả phòng** | Bước 3. Đề nghị PO thêm story "nhắc trước ngày đến kèm vị trí"; UXD viết mẫu tin mới `msg.arrival_reminder` (VI/EN/RU) |
| Trong lúc ở | Trang khách `g.` (US-108, US-109) + chat | OA chat | Bước 4 |
| Bill, trả phòng nhanh | Lễ tân in/đưa | US-040, US-138 (R3): bill qua email/Zalo | – |
| Cảm ơn, mời đánh giá, ưu đãi lần sau | Không có | US-116 (R3) | Bước 5 (ẩn tới khi có) |

Lưu ý cho INT/SEC: không gửi mã cửa hay giấy tờ qua Zalo (`integrations.md` 3.4, SEC-07); mẫu ZNS phải được Zalo duyệt trước [Chưa xác minh thời gian duyệt]; OA chỉ nhắn chủ động cho người đã quan tâm/tương tác trong một khoảng thời gian [Chưa xác minh chính sách hiện hành].

## 12. Trạng thái và ngoại lệ

| Tình huống | Cách xử lý |
|---|---|
| JavaScript lỗi/tắt | Mọi nút là link thật; ô Hỏi phòng vẫn hiện, nút gửi mở Zalo không kèm tin soạn sẵn |
| Mạng chậm | Nền `--surface-2` giữ chỗ ảnh; chữ hiện trước ảnh; không spinner giữa trang |
| Ảnh lỗi | Giữ khung màu nền + alt; không vỡ bố cục |
| Ngày không hợp lệ | Lỗi tại ô (mục 4.3), giữ dữ liệu đã nhập |
| Không chép được | Mục 10.2 |
| Trang EN/RU chưa có | Bộ chọn ngôn ngữ ghi "(sắp có)", không dẫn tới trang lỗi |
| Chưa có số liệu (giá, khoảng cách) | Ẩn dòng đó, không hiện "0" hay "⟨…⟩" trên bản thật (mock hiện chip "chờ INV") |

## 13. Pháp lý và quyền riêng tư (chuyển SEC/PO, luật sư ESC-001)

- **Thông báo website thương mại điện tử**: website có **chức năng đặt hàng trực tuyến** phải thông báo với Bộ Công Thương qua online.gov.vn (NĐ 52/2013, sửa bởi NĐ 85/2021) [Nguồn – trang tư vấn luật, chưa đối chiếu văn bản gốc; có thể đã có quy định mới năm 2025–2026 – Chưa xác minh]. L1 chỉ là trang giới thiệu + chat → có thể chưa thuộc diện; **L2 (gửi yêu cầu giữ chỗ) cần luật sư xác nhận**. Đề nghị thêm câu này vào danh sách luật sư (ESC-001).
- Trang **Chính sách quyền riêng tư** trước L2 (form có tên, SĐT, email). L1 không thu dữ liệu, nhưng vẫn nên có trang này (công cụ đo lường, liên kết chat).
- Đo lường không cookie → không cần banner cookie [Chưa xác minh theo luật VN – SEC].
- **Ảnh**: chỉ dùng ảnh OTTIMO sở hữu hoặc có quyền dùng cho web/quảng cáo (Q2). Ảnh có người cần giấy đồng ý.
- **Đánh giá**: chỉ trích đánh giá thật, ghi nguồn; kiểm điều khoản của OTA về trích dẫn đánh giá [Chưa xác minh].
- **Giá**: kiểm điều khoản ngang giá (rate parity) với các OTA trước khi công khai giá trực tiếp thấp hơn [Chưa xác minh].

## 14. Bàn giao và việc tiếp theo

| Vai | Việc |
|---|---|
| PO | Viết story L1 (landing giới thiệu); story "nhắc trước ngày đến + vị trí"; gom câu hỏi INV vào ESC-020 (mục 15) |
| ARC | Chốt ứng dụng chứa landing (`booking-web` hay `landing-web`), công nghệ tạo trang tĩnh, nơi đặt script ảnh |
| OPS | Tên miền gốc trỏ landing; `X-Robots-Tag: noindex` cho `desk.`/`staff.`/`g.`; cache; Lighthouse CI |
| FE | Dựng từ mock khi PO đưa vào sprint; dùng token, không màu tùy tiện |
| DATA | Chọn công cụ đo không cookie; sự kiện mục 10.4 |
| SEC | Mục 13; trang quyền riêng tư |
| INT | Zalo OA: định dạng link, QR, chính sách nhắn chủ động (mục 11) |
| UXR | Thử 5 người (2 Việt, 2 nước ngoài, 1 người lớn tuổi) với mock: tìm giá tháng, hỏi phòng, tìm đường |
| UXD | Khi có ảnh: chọn ảnh theo mục 6, xuất theo mục 7; viết EN; vẽ MAP-01; thêm token khi chốt hướng |

## 15. Việc cần INV quyết – dự thảo ESC (ORC đánh số; đề xuất gộp vào ESC-020 về landing)

```
# ESC-0xx – Landing page: màu thương hiệu, ảnh, công khai giá, kênh chat cho khách nước ngoài
- Người tạo: UXD | Round: 2 | Mức khẩn: Bình thường (gom cuối round)
- Bối cảnh: Đội đang thiết kế trang giới thiệu OTTIMO trên tên miền chính. Trang cần ảnh thật,
  một màu thương hiệu thống nhất với app, và cách để khách Việt lẫn khách nước ngoài liên hệ nhanh.
  Một số điểm là nhận diện thương hiệu, quyền dùng ảnh và chính sách giá – chỉ chủ đầu tư quyết được.
- Câu hỏi cần quyết định: Chủ đầu tư chọn màu chủ đạo, xác nhận ảnh, cách công khai giá và kênh chat
  cho khách nước ngoài?
- Phương án:
  Q1 – Màu chủ đạo của trang
  - A (đề xuất): giữ tông kem – gỗ sồi như app, đất nung chỉ làm điểm nhấn. – Ưu: đồng bộ app, tin nhắn,
    bill; làm ngay. – Nhược: khác e-brochure nếu brochure dùng đất nung làm màu chính. – 0 đ.
  - B: đất nung làm màu chính (nút, dải màu) theo e-brochure. – Ưu: khớp brochure. – Nhược: nên đổi
    theo cả app khách và mẫu tin để không lệch; thêm ~1–2 ngày UXD. – 0 đ.
  Q2 – Ảnh
  - A (đề xuất): dùng ảnh trong Drive; chủ đầu tư xác nhận OTTIMO có quyền dùng cho web/quảng cáo,
    cho biết "Phòng 1–5" là căn nào; chụp bổ sung view, quanh khu, ban công, đậu xe khi tiện
    (tự chụp bằng điện thoại tốt được). – Chi phí: 0 đ nếu tự chụp.
  - B: thuê nhiếp ảnh chụp trọn bộ theo chỉ đạo ảnh (concept mục 5.7). – Ưu: đồng đều, đẹp nhất.
    – Nhược: chi phí, lịch chụp. – Chi phí: chưa xác minh (chủ đầu tư tự hỏi giá).
  Q3 – Công khai giá trên trang
  - A (đề xuất): chỉ hiện "Thuê tháng từ …" (giá niêm yết tháng); giá theo đêm: "hỏi để có giá trực tiếp".
    – Ưu: hút khách dài hạn, không vướng giá OTA. – Nhược: khách ngắn ngày phải hỏi.
  - B: hiện cả "từ … /đêm". – Ưu: rõ nhất. – Nhược: giá đêm đổi theo lịch; có thể vướng điều khoản ngang
    giá với OTA (chưa xác minh).
  - C: không hiện giá. – Ưu: linh hoạt. – Nhược: khách rời trang vì thiếu thông tin.
  Q4 – Kênh chat cho khách nước ngoài (khách quốc tế thường không có Zalo)
  - A (đề xuất): Zalo OA cho khách Việt + WhatsApp số hotline OTTIMO cho khách nước ngoài.
  - B: thêm Telegram (khách Nga dùng nhiều – giả định từ persona P6, chưa kiểm chứng).
  - C: chỉ Zalo + email.
- Thông tin chủ đầu tư gửi (không cần chọn): tên miền; địa chỉ chính xác + vị trí Google Maps; hotline;
  email; Zalo OA (khi tạo) hoặc Zalo số hotline tạm; link trang OTTIMO trên Booking.com/Airbnb/Agoda;
  có thang máy, chỗ đậu xe, nhận thú cưng không; tên doanh nghiệp + mã số thuế cho chân trang;
  3–5 đánh giá thật muốn đưa lên; file e-brochure và logo (nếu có).
- Đội đề xuất: Q1 A (chuyển B nếu brochure xác nhận đất nung là màu thương hiệu), Q2 A, Q3 A, Q4 A.
- Nếu chưa quyết thì: dựng theo hướng A với ô ảnh trống có mã; ẩn giá; chỉ nút Zalo + gọi điện;
  không chặn việc thiết kế và dựng khung.
- Hạn cần trả lời: trước khi FE dựng landing (đầu Round 3).
- Trạng thái: Chờ INV (dự thảo UXD)
```

Ngoài phạm vi UXD (ORC/PO/INT xử lý): phạm vi landing (ESC-020 ORC đã đề xuất); Zalo OA/ZNS thay đổi so với ESC-010 phương án B; xác nhận pháp lý TMĐT (ESC-001).

## 16. Giả định
| # | Giả định | Ảnh hưởng nếu sai |
|---|---|---|
| G-1 | Tên miền gốc dành cho landing; `ottimo.vn` chỉ là ví dụ | Đổi thẻ SEO, link |
| G-2 | L1 là trang tĩnh, không backend, VI trước | Nếu cần form → thêm SEC + backend |
| G-3 | Tên kiểu căn công khai: Studio / Căn 1 phòng ngủ / Căn 2 phòng ngủ | PO/DOM đổi tên |
| G-4 | Bếp, bàn làm việc, Wi-Fi ≥ 50 Mbps, sưởi/điều hòa có ở mọi căn (theo checklist R0) | Sửa câu điểm nổi bật |
| G-5 | Giờ trực lễ tân 07:00–22:00 (BR-811), có người trực đêm (ESC-010 T-A) | Sửa chân trang, hỏi đáp |
| G-6 | Tinh thần "Terracotta – Slow Living" chỉ suy từ tên file brochure | Chọn lại hướng sau khi đọc brochure |
| G-7 | Tầng 3–4 cho 301–402 suy từ số căn | Sửa thẻ căn |
| G-8 | Không nhúng script bên thứ ba ở L1 | Nếu INV muốn chat nhúng → đo lại LCP, SEC xem cookie |

## 17. Nguồn tham khảo (tra 17/10/2026)
- LCP tốt ≤ 2,5 giây, đo ở phân vị 75: https://web.dev/articles/lcp
- Cấu hình "Slow 4G" của Lighthouse (RTT 150ms, 1,6 Mbps, CPU 4×): https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md
- Hỗ trợ AVIF (~96%, iOS Safari 16+): https://caniuse.com/avif
- Open Graph (4 thuộc tính bắt buộc, `og:image:alt`, `og:locale:alternate`): https://ogp.me/
- schema.org `Hotel` / `LodgingBusiness` (checkinTime, checkoutTime, amenityFeature…): https://schema.org/Hotel
- Google Maps URL (`/maps/dir/?api=1&destination=`): https://developers.google.com/maps/documentation/urls/get-started
- WhatsApp click-to-chat `wa.me` – trang chính thức không đọc được khi tra, thông tin lấy từ bài tổng hợp [Chưa xác minh]: https://faq.whatsapp.com/5913398998672934
- Zalo OA chat link / widget – tài liệu chính thức không tải được khi tra [Chưa xác minh]: https://developers.zalo.me/
- Thông báo website TMĐT (NĐ 85/2021 sửa NĐ 52/2013) – trang tư vấn luật, chưa đối chiếu văn bản gốc: https://luatvietnam.vn/doanh-nghiep/diem-moi-cua-nghi-dinh-85-2021-ve-thuong-mai-dien-tu-561-33179-article.html

## 18. Lịch sử thay đổi
| Phiên bản | Ngày | Người | Nội dung |
|---|---|---|---|
| 0.1 | 17/10/2026 | UXD | Bản đầu: mục tiêu, đối tượng, IA 12 mục, dàn ý VI, hướng A + biến thể B (token đất nung đo tương phản, 0 cặp không đạt), 10 nhóm ô ảnh, đường ống ảnh + ngân sách LCP, 14 quy tắc a11y, SEO/OG/JSON-LD, đặc tả 2 nút, bảng điểm chạm Zalo OA, dự thảo ESC 4 câu |
