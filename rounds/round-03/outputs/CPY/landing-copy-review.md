# Rà câu chữ landing ottimo.vn – CPY

- Người viết: CPY | Round 3 – bước Sản xuất | Ngày: 24/10/2026
- Bản rà: mã `product/apps/landing-web/src/content/en.ts`, `vi.ts`, `site.json` (đối chiếu trang đang chạy https://ottimo.vn – khớp mã, form đang tắt nên khối `book.chat` là thứ khách thấy ở mục đặt phòng). Đọc thêm: `src/scripts/booking-strings.ts`, `copy.test.ts`, `scripts/dist-checks.mjs`, `product/design/landing/concept.md` v1.2.1, `rounds/round-02/outputs/DOM/landing-positioning.md`.
- Nguồn sự thật: `00-brief/investor-brief.md`, `00-brief/context/landing/ebrochure-text.md`, `product/docs/business-rules.md`. Brand guideline thắng khi mâu thuẫn.
- Concept đi kèm: `concept.md` (ý xuyên suốt "Stay for the mornings", thứ tự mục, phễu). Câu mới dưới đây viết theo concept đó.
- **Chưa áp.** Cần UXD kiểm khung → PO → INV duyệt → FE-LP áp (SOW mục 5).

## 0. Tóm tắt

1. **Gốc của vấn đề "small hotel"**: câu định vị DOM 1.1 / concept 2.1 ("the care of a small hotel" / "sự chăm chút của một khách sạn nhỏ") đứng ở **hai chỗ đắt nhất**: lead hero và meta description (đoạn Google và Zalo/Facebook hiện khi chia sẻ link). Câu đúng về logic (so sánh mức chăm sóc) nhưng về bán hàng nó **kéo OTTIMO xuống**: khách đọc "khách sạn nhỏ" trước khi kịp thấy "boutique". Đề xuất **bỏ hẳn chữ "hotel / khách sạn"** trên trang (hiện 3 chỗ → 0), đồng thời gỡ luôn rủi ro pháp lý LZ-9 (concept 2.4).
2. **Quá thẳng ở thân trang**: dòng dưới lưới hạng phòng nói "extra-guest fee / (có phụ thu)"; FAQ ở dài nói "Utilities by meter / Điện nước theo công tơ"; mục Why kể giờ nhận phòng; khối Zalo nói "Online requests open soon / sắp mở" (trang trông chưa xong). Chuyển các chi tiết này sang **phần để lại yêu cầu, báo giá và sale** (concept mục 5).
3. **Kê thông số thay vì gợi cảm giác**: hero lead liệt kê "kitchen, washer-dryer, desk" như tin rao; FAQ đầu trả lời bằng danh sách. Viết lại theo **trải nghiệm** (giấc ngủ, buổi sáng, ánh gỗ, ban công, nhịp sống), giữ thông số ở **một chỗ** – Tiện nghi.
4. **Tiếng Việt lủng củng**: lặp "OTTIMO" làm chủ ngữ (8 chỗ: "OTTIMO trả lời kèm phòng trống và giá", "Trò chuyện với OTTIMO"…), câu dịch cứng ("Một đêm thì là điều dễ chịu. Một tháng thì là điều cần có.", "Vượt những gì một phòng khách sạn mang lại"). Đề xuất xưng **"chúng tôi"** ở thân trang; giữ "OTTIMO" ở câu chống giả danh (cần rõ danh tính) – câu hỏi Q3 trong kết quả trả về.
5. **CTA**: "Request to book / Yêu cầu đặt phòng" đúng nghiệp vụ (phương án A) nhưng khô và nghe như thủ tục. Đề xuất **"Plan your stay / Chọn ngày ở"** cho nút chính – vẫn không hứa xác nhận ngay (Q1).
6. Tổng: rà toàn bộ chuỗi khách đọc được (thân trang, form, trang cảm ơn, 404). Đề xuất đổi **khoảng 50 chuỗi** (gồm 2 link chữ mới dẫn về phễu và 4 chi tiết chuyển khỏi thân trang: phụ thu, công tơ, giờ nhận phòng ở mục Why, "sắp mở"); còn lại giữ (nhãn chức năng, câu pháp lý SEC, bảng khoảng cách).

### Ký hiệu cột "Vấn đề"
| Mã | Nghĩa |
|---|---|
| **LOÃNG** | Làm loãng định vị (small hotel, so sánh khách sạn, nghe như căn hộ/thuê nhà) |
| **THẲNG** | Quá thẳng: giá, phụ thu, phí, công tơ, giờ giấc vận hành nằm ở thân trang |
| **KÊ** | Kê thông số thay vì gợi trải nghiệm |
| **LỦNG** | Lủng củng, dịch cứng, lặp từ, nhịp câu gãy |
| **NHẠT** | Đúng nhưng nhạt/sáo, không gợi tò mò |
| **PHỄU** | Không dẫn khách tới hành động, hoặc làm khách chần chừ |
| Giữ | Ổn, không đổi |

---

## 1. Meta (Google, link chia sẻ Zalo/Facebook)

| # | Khóa | Câu cũ (EN / VI) | Vấn đề | Câu mới EN | Câu mới VI |
|---|---|---|---|---|---|
| 1.1 | `meta.title` | OTTIMO Boutique Stay · Da Lat / OTTIMO Boutique Stay · Đà Lạt | Giữ | – | – |
| 1.2 | `meta.description` | A boutique stay in Da Lat: the care of a small hotel, with a kitchen, a washer-dryer and a desk in every room. Stay a night, or a season. Chat with us on Zalo. / Boutique stay ở Đà Lạt: sự chăm chút của một khách sạn nhỏ; mỗi phòng đều có bếp, máy giặt sấy và bàn làm việc riêng. Ở một đêm, hay cả một mùa. Nhắn qua Zalo. | **LOÃNG** – "small hotel" là cụm đầu tiên khách đọc trên Google. **KÊ** | A boutique stay on a quiet Da Lat hillside: deep sleep, slow mornings and room to live well. Stay a night, or a season. Plan your stay on Zalo. *(143 ký tự)* | Boutique stay trên triền đồi yên tĩnh ở Đà Lạt: giấc ngủ sâu, buổi sáng thong thả, không gian để sống chậm. Ở một đêm, hay trọn một mùa. Nhắn Zalo. *(147 ký tự)* |
| 1.3 | `meta.ogImageAlt` | OTTIMO at dusk, with warm lights on every balcony / … | Giữ | – | – |

## 2. Thanh điều hướng và nút hành động

| # | Khóa | Câu cũ (EN / VI) | Vấn đề | Câu mới EN | Câu mới VI |
|---|---|---|---|---|---|
| 2.1 | `nav.why` | Why OTTIMO / Vì sao OTTIMO | **NHẠT** – giọng tài liệu so sánh sản phẩm | The Stay | Kỳ lưu trú |
| 2.2 | `nav.rooms`, `amenities`, `location`, `faq`, `contact` | Rooms · Amenities · Location · FAQ · Contact / Hạng phòng · Tiện nghi · Vị trí · Hỏi đáp · Liên hệ | Giữ (rõ, tốt cho SEO). VI "Hạng phòng" → "Phòng nghỉ" mềm hơn | – | Phòng nghỉ · Tiện nghi · Vị trí · Hỏi đáp · Liên hệ |
| 2.3 | `actions.requestToBook` | Request to book / Yêu cầu đặt phòng | **PHỄU** – nghe như thủ tục; VI 17 ký tự, dài trên thanh dính 360 px. Vẫn đúng phương án A (không hứa xác nhận ngay) | **Plan your stay** *(Q1)* | **Chọn ngày ở** *(Q1)* |
| 2.4 | `actions.chatOnZalo`, `chatOnPrefix` | Chat on Zalo / Chat qua Zalo · "Chat qua " | VI pha tiếng Anh không cần | Chat on Zalo (giữ) | Nhắn qua Zalo · "Nhắn qua " |
| 2.5 | `skip`, `langSwitch`, `langSuggest`, `actions.newTab`, `carousel.*`, `gallery.*`, `sticky.label` | Nhãn trợ năng, chức năng | Giữ (UXD giữ quyền a11y) | – | – |

## 3. Hero

| # | Khóa | Câu cũ (EN / VI) | Vấn đề | Câu mới EN | Câu mới VI |
|---|---|---|---|---|---|
| 3.1 | `hero.label` | Boutique stay · Da Lat / Boutique stay · Đà Lạt | Giữ – gọi đúng loại hình ngay trên H1 | – | – |
| 3.2 | H1 (`site.json` `tagline`) | A refined stay inspired by the calm spirit of Dalat. | Giữ – tagline thương hiệu, H1 tiếng Anh ở cả hai trang (concept 2.3) | – | – |
| 3.3 | `hero.lead` | The care of a small hotel, with a kitchen, a washer-dryer and a desk in every room. / Sự chăm chút của một khách sạn nhỏ; mỗi phòng đều có bếp, máy giặt sấy và bàn làm việc riêng. | **LOÃNG** (lỗi INV nêu đích danh). **KÊ** – ba món đồ gia dụng ngay dưới tagline "refined" làm tụt cảm xúc; đọc như tin cho thuê. Dấu ";" trong VI làm câu gãy (**LỦNG**) | Quiet rooms on a Da Lat hillside, made for deep sleep, slow mornings and longer stays. *(86 ký tự; cũ 83)* | Phòng nghỉ yên tĩnh trên triền đồi Đà Lạt, cho giấc ngủ sâu, buổi sáng thong thả và những kỳ ở dài. *(99; cũ 93)* |

- Vì sao: lead nói ba điều khách mua – **yên tĩnh** (lõi thương hiệu "Effortless calm"), **giấc ngủ** (trụ cột Sleep Quality, có Dunlopillo chứng minh ở Tiện nghi), **buổi sáng** (ý xuyên suốt của concept) – và "longer stays" mở lời cho khách ở dài mà không nói "thuê tháng". Bếp, máy giặt sấy, bàn làm việc chuyển xuống thẻ "For a season" và Tiện nghi, nơi khách đã muốn biết thêm.

## 4. Mục Why → "The Stay" (`#why`)

| # | Khóa | Câu cũ (EN / VI) | Vấn đề | Câu mới EN | Câu mới VI |
|---|---|---|---|---|---|
| 4.1 | `why.label` | Why OTTIMO / Vì sao OTTIMO | **NHẠT** (như 2.1) | The Stay | Kỳ lưu trú |
| 4.2 | `why.title` | Stay a night, or a season. / Ở một đêm, hay cả một mùa. | Câu tốt nhưng chỉ nói *độ dài*, chưa nói *vì sao muốn ở* | **Stay for the mornings.** | **Ở lại vì những buổi sáng.** |
| 4.3 | `why.intro` | Two ways to stay, one standard of care. / Hai cách ở, một chuẩn chăm chút. | **NHẠT** – giọng quy trình ("standard of care") | Cool hillside air, first light on warm oak, a quiet that stays with you. Stay a night, or a season. | Không khí mát lành của đồi, nắng sớm trên sắc gỗ sồi, một sự yên tĩnh theo bạn suốt ngày. Ở một đêm, hay trọn một mùa. |
| 4.4 | `why.short.label` | For a few nights / Ở vài đêm | Giữ EN; VI chỉnh nhịp | For a few nights | Cho vài đêm |
| 4.5 | `why.short.title` | Beyond what a hotel room gives you / Vượt những gì một phòng khách sạn mang lại | **LOÃNG** – đặt OTTIMO vào hệ quy chiếu "phòng khách sạn". VI dịch cứng (**LỦNG**) | Room to breathe, even for a night | Rộng rãi, dù chỉ một đêm |
| 4.6 | `why.short.body` | Check in at 14:00 to a quiet room, a bed made for deep sleep and daily housekeeping. And more space than you expected, with a balcony of your own. / Nhận phòng lúc 14:00: phòng yên tĩnh, giường cho giấc ngủ sâu, dọn phòng mỗi ngày. Và rộng hơn bạn nghĩ, có cả ban công riêng. | **THẲNG** – giờ nhận phòng mở đầu một câu bán cảm xúc (đã có ở Tiện nghi + FAQ). "And more space…" gãy nhịp | A quiet room, a bed made for deep sleep, housekeeping every day. Then the surprise: more space than you planned for, and a balcony of your own. | Phòng yên tĩnh, giường cho giấc ngủ sâu, dọn phòng mỗi ngày. Rồi một điều bất ngờ: rộng hơn bạn nghĩ, và ban công là của riêng bạn. |
| 4.7 | `why.long.label` | For a month, or longer / Ở một tháng, hay lâu hơn | Giữ EN; VI chỉnh nhịp | For a month, or longer | Cho một tháng, hay lâu hơn |
| 4.8 | `why.long.title` | Made for living here / Sinh ra cho những kỳ ở dài | **NHẠT**; VI "sinh ra cho" dịch từ "made for" | A season that feels like yours | Một mùa Đà Lạt của riêng bạn |
| 4.9 | `why.long.body` | Unpack once and settle into your own rhythm: market mornings, dinners cooked at home, quiet hours of work by the window. Monthly rates and a housekeeping plan to suit you. / Dỡ vali một lần rồi sống theo nhịp của bạn: … Giá theo tháng và gói dọn phòng tùy chọn. | Câu đầu tốt – giữ. Câu cuối **THẲNG** nhẹ ("rates", "plan" – giọng bảng giá). Thêm bếp, máy giặt sấy ở đây (chuyển từ hero) để khách ở dài thấy "sinh ra cho mình" | Unpack once and find your rhythm: market mornings, dinners from your own kitchen, quiet hours of work by the window, laundry done without leaving the room. Everything shaped around how you live. | Dỡ vali một lần rồi sống theo nhịp của mình: sáng ghé chợ, tối nấu bữa cơm trong gian bếp riêng, những giờ làm việc yên tĩnh bên cửa sổ, giặt sấy ngay trong phòng. Mọi thứ theo cách bạn sống. |
| 4.10 | (mới, link chữ cuối mục) | – | **PHỄU** – mục cảm xúc nhất chưa có lối đi tiếp | See the rooms | Xem các phòng |

- `#why` không được chứa "meter/công tơ" (dist-checks) – câu mới không có.
- 4.9 dài hơn câu cũ ~10%; UXD kiểm thẻ trên điện thoại.

## 5. Hạng phòng (`#rooms`)

| # | Khóa | Câu cũ (EN / VI) | Vấn đề | Câu mới EN | Câu mới VI |
|---|---|---|---|---|---|
| 5.1 | `rooms.label` | Rooms / Hạng phòng | Giữ EN | Rooms | Phòng nghỉ |
| 5.2 | `rooms.title` | Four ways to stay / Chọn phòng hợp với bạn | **NHẠT** – "four ways" là con số, không gợi gì | **Choose your window** | **Chọn khung cửa sổ của bạn** |
| 5.3 | `rooms.intro` | From a studio for two to two bedrooms for four, looking out over the garden or the city. / Từ studio cho hai người đến hai phòng ngủ cho bốn người, nhìn ra vườn hoặc thành phố. | Đúng nhưng đọc như bảng thông số | City lights or garden green. A studio for two, or two bedrooms for the whole family. | Phố lên đèn hay vườn xanh trước mặt. Studio cho hai người, hoặc hai phòng ngủ cho cả gia đình. |
| 5.4 | `rooms.request` | Request this room / Yêu cầu hạng phòng này | **PHỄU** – cùng vấn đề 2.3; "hạng phòng này" cứng | Ask about this room | Nhận báo giá phòng này |
| 5.5 | `rooms.items[0].desc` (City) | City lights from your window. Easy for a weekend, easy for a month. / Phố đêm ngay bên khung cửa. Gọn cho một cuối tuần, đủ cho một tháng. | **NHẠT** – "Easy… easy" lặp; VI "gọn… đủ" nghe như chịu đựng | Da Lat glows beyond the glass at night. Right for a weekend; right for a month. | Đêm xuống, Đà Lạt lên đèn ngay sau khung kính. Vừa vặn cho một cuối tuần, trọn vẹn cho một tháng. |
| 5.6 | `rooms.items[1].desc` (Garden) | Glass to the garden and a private balcony. Morning light for a short stay; a quiet desk for the weeks after. / Cửa kính nhìn ra vườn và ban công riêng. … | Gần tốt; câu đầu thiếu động từ, chưa có người trong cảnh | Wake to green beyond the glass and a balcony of your own. Morning light for a short stay; a quiet desk for the weeks that follow. | Thức dậy giữa sắc xanh sau khung kính, ban công là của riêng bạn. Nắng sớm cho chuyến đi ngắn; góc làm việc yên tĩnh cho những tuần ở lại. |
| 5.7 | `rooms.items[2].desc` (Premium) | A bedroom, a living room and a [[1.4 m]] extra bed for one more guest. The space of a suite for a short stay; room for family on a long one. / Phòng ngủ riêng, phòng khách riêng và giường phụ [[1,4 m]] cho thêm một người. Rộng như một suite… | Kê; bỏ mất chi tiết đẹp nhất của brochure (bếp navy dài) | A separate bedroom and living room, a long navy kitchen and a [[1.4 m]] extra bed for one more. A suite for a short stay; room for family on a long one. | Phòng ngủ, phòng khách tách riêng, gian bếp navy dài và giường phụ [[1,4 m]] cho thêm một người. Như một suite khi ở ngắn; đủ chỗ đón người thân khi ở lâu. |
| 5.8 | `rooms.items[3].desc` (Signature) | Two bedrooms, a table for four and a sunset balcony. One booking for the whole family, or for two remote workers over a season. / … Một lần đặt cho cả gia đình… | "One booking" – giọng giao dịch; "remote workers" khô | Two bedrooms, a table for four and a balcony that holds the sunset. One stay for the whole family, or for two who work remotely through a season. | Hai phòng ngủ, bàn ăn bốn người và ban công đón hoàng hôn. Một kỳ nghỉ cho cả gia đình, hoặc cho hai người làm việc từ xa suốt một mùa. |
| 5.9 | `rooms.items[].view` | City view · Garden view / Nhìn ra phố · Nhìn ra vườn | Giữ | – | – |
| 5.10 | `rooms.items[].name`, `shortName`, `altName` | Standard Studio · City View … Premium · One Bedroom + 1 … | **LOÃNG** nhẹ – "Standard" kéo cảm nhận xuống mức cơ bản; "+ 1" khó hiểu với khách lạ. **Đổi tên cần INV** (Q5) | Đề xuất: City Studio · Garden Studio · Premium One-Bedroom · Signature Two-Bedroom | Studio hướng phố · Studio hướng vườn · Premium một phòng ngủ · Signature hai phòng ngủ |
| 5.11 | `rooms.note` | The higher number includes one more guest, on the sofa or, in Premium, the extra bed, with an extra-guest fee. Rates by the night or by the month, on request. / Số lớn hơn là khi thêm một khách, ngủ sofa hoặc giường phụ ở hạng Premium (có phụ thu). Giá theo đêm hoặc theo tháng, báo khi bạn gửi yêu cầu. | **THẲNG** – "extra-guest fee / có phụ thu" là ví dụ INV nêu. Câu dài, giọng điều khoản | Room for one more guest on request. Rates by the night or by the month, prepared for your dates. | Có thể thêm một khách theo yêu cầu. Giá theo đêm hoặc theo tháng, báo riêng theo ngày ở của bạn. |

- 5.11: chi tiết "sofa hay giường phụ" và chi phí khách thêm **chuyển sang form** (`booking-strings.ts` `roomHint`, mục 8.6) và báo giá – nơi khách đã chọn số người. Test `copy.test.ts` "rooms.note must match /Premium/" cần đổi (mục 11).
- "Sleeps 2–3" giữ: con số sức chứa là thông tin, không phải phí.

## 6. Tiện nghi (`#amenities`)

| # | Khóa | Câu cũ (EN / VI) | Vấn đề | Câu mới EN | Câu mới VI |
|---|---|---|---|---|---|
| 6.1 | `amenities.title` | The details you feel every day. / Những chi tiết bạn cảm nhận mỗi ngày. | Giữ – đúng bộ lọc thương hiệu (3) | – | – |
| 6.2 | `amenities.intro` | Small luxuries for one night. The essentials for a month. / Một đêm thì là điều dễ chịu. Một tháng thì là điều cần có. | EN giữ. VI **LỦNG** ("thì là… thì là") | – | Ở một đêm, đó là sự chiều chuộng. Ở một tháng, đó là điều cần có. |
| 6.3 | `groups[0]` Sleep | Hotel-grade Dunlopillo mattress and bedding. Ceiling air conditioning that never blows at the bed. / Nệm và chăn ga Dunlopillo chuẩn khách sạn. … | **LOÃNG** – "hotel-grade" là một trong 3 chữ "hotel" còn lại | Dunlopillo mattress and fine bedding, chosen for deep sleep. Ceiling air conditioning that never blows at the bed. | Nệm và chăn ga Dunlopillo, chọn cho giấc ngủ sâu. Điều hòa âm trần, không thổi thẳng vào giường. |
| 6.4 | `groups[1]` Kitchen & laundry | Hafele induction hob, Samsung [[280 L]] fridge, microwave and kettle. Electrolux washer and dryer in the room. / … ngay trong phòng. | Giữ ý (đây là chỗ duy nhất kê thiết bị). Thêm "your own" cho cảm giác sở hữu | Hafele induction hob, a Samsung [[280 L]] fridge, microwave and kettle. Your own Electrolux washer and dryer, in the room. | Bếp từ Hafele, tủ lạnh Samsung [[280 lít]], lò vi sóng, ấm đun. Máy giặt và máy sấy Electrolux của riêng bạn, ngay trong phòng. |
| 6.5 | `groups[2]` Work & rest | A [[1 Gbps]] fibre line, a desk by the window, a [[55-inch]] 4K TV and a hot rain shower. / … | Giữ | – | – |
| 6.6 | `groups[3]` title + body | Reception & arrival · Reception on the ground floor, [[07:00–22:00]]. Check-in 14:00, check-out 12:00. A smart lock, so late arrivals are easy. / Lễ tân & nhận phòng · … Khóa điện tử, đến muộn vẫn dễ dàng. | **THẲNG** nhẹ – ba câu vận hành cụt. Giữ số (test yêu cầu giờ lễ tân), viết lại thành lời đón | **Arrival** · A warm welcome at the ground-floor reception, [[07:00–22:00]], and a smart lock for late arrivals. Check-in from 14:00, check-out by 12:00. | **Đón bạn** · Lễ tân đón bạn ở tầng trệt, [[07:00–22:00]]; khóa điện tử để bạn đến muộn vẫn thong thả. Nhận phòng từ 14:00, trả phòng trước 12:00. |

## 7. Vị trí (`#location`)

| # | Khóa | Câu cũ (EN / VI) | Vấn đề | Câu mới EN | Câu mới VI |
|---|---|---|---|---|---|
| 7.1 | `location.title` | A quiet hillside, minutes from town. / Triền đồi yên tĩnh, vài phút tới trung tâm. | Giữ – câu tốt | – | – |
| 7.2 | `location.intro` | Calm evenings at home; the market, cafés and the lake a short drive away. / Về là yên tĩnh; chợ, cà phê và hồ chỉ cách vài phút đi xe. | EN giữ ý, làm mượt. VI "Về là yên tĩnh" cụt | Come home to quiet. The market, the cafés and Xuan Huong Lake are a short drive away. | Về đến là yên tĩnh. Chợ, những quán cà phê và hồ Xuân Hương chỉ cách vài phút đi xe. |
| 7.3 | `location.rows`, `caption`, `head`, `note`, `maps`, `copy*` | Bảng 6 điểm, nhãn nút | Giữ (số liệu brochure, test dấu thập phân) | – | – |
| 7.4 | (mới, link chữ cuối mục) | – | **PHỄU** – sau khi khách đã "thấy mình ở đó" | Ask us about your dates | Hỏi chúng tôi về ngày ở |

## 8. Đặt phòng (`#book`) – phần "để lại yêu cầu"

Đây là **cửa phễu**. Được nói rõ quy trình và cọc (INV: chi tiết nằm ở đoạn khách để lại yêu cầu), nhưng giọng phải là lời mời, không phải thủ tục.

| # | Khóa | Câu cũ (EN / VI) | Vấn đề | Câu mới EN | Câu mới VI |
|---|---|---|---|---|---|
| 8.1 | `book.label` | Book direct / Đặt trực tiếp | Giữ (không phải nút) | – | – |
| 8.2 | `book.title` | Request to book / Yêu cầu đặt phòng | **PHỄU** (như 2.3) | Plan your stay | Lên kế hoạch cho kỳ nghỉ |
| 8.3 | `book.intro` | Tell us your dates. We reply with availability and your rate. / Cho OTTIMO biết ngày bạn đến. OTTIMO trả lời kèm phòng trống và giá. | **LỦNG** (VI lặp OTTIMO, "kèm phòng trống và giá" như máy). **THẲNG** nhẹ | Share your dates and how you like to travel. We will suggest the right room and prepare a rate for your stay. | Cho chúng tôi biết ngày bạn đến và cách bạn muốn ở. Chúng tôi sẽ gợi ý phòng phù hợp và gửi báo giá riêng cho bạn. |
| 8.4 | `book.steps[0]` | Send a request · Dates, guests and the room you like. / Gửi yêu cầu · Ngày ở, số khách, hạng phòng bạn thích. | Gần tốt | Share your dates · Dates, guests and the room you have in mind. | Gửi ngày ở · Ngày ở, số khách và phòng bạn thích. |
| 8.5 | `book.steps[1]` | We confirm on Zalo · Within 1 hour ([[07:00–22:00]], Da Lat time); outside these hours, before 09:00 the next morning. / OTTIMO xác nhận qua Zalo · … | "Confirm" dễ hiểu là xác nhận đặt chắc (trái phương án A). VI lặp OTTIMO. Giữ số (test) | We reply on Zalo · Within 1 hour ([[07:00–22:00]], Da Lat time); outside these hours, before 09:00 the next morning. | Chúng tôi trả lời qua Zalo · Trong 1 giờ ([[07:00–22:00]], giờ Đà Lạt); ngoài giờ, trước 09:00 sáng hôm sau. |
| 8.6 | `book.steps[2]` | Secure your room · Your room is held once you confirm and pay a 30% deposit by QR transfer. / Giữ phòng · Phòng được giữ khi bạn xác nhận và chuyển cọc 30% qua mã QR. | Giọng điều kiện ("once you… and pay"). Giữ 30% (test, SEC chống giả danh, minh bạch trước khi cọc) – nằm đúng phần để lại yêu cầu | Your room, held for you · When the quote feels right, a 30% deposit by QR transfer holds your room. | Giữ phòng cho bạn · Khi bạn ưng báo giá, khoản cọc 30% qua mã QR sẽ giữ phòng cho bạn. |
| 8.7 | `book.reassure` | No payment on this website. A request does not commit you to anything. / Không thanh toán trên website. Gửi yêu cầu không ràng buộc bạn điều gì. | Đúng; viết ấm hơn, cùng nghĩa | Nothing to pay here, and no commitment until you say yes. | Không thanh toán trên trang này, và không ràng buộc gì cho đến khi bạn đồng ý. |
| 8.8 | `book.chat.title` | Send your dates on Zalo / Gửi ngày ở qua Zalo | Giữ | – | – |
| 8.9 | `book.chat.text` (khách đang thấy – form tắt) | Online requests open soon. For now, message us your dates and number of guests. We reply within 1 hour ([[07:00–22:00]]); outside these hours, before 09:00. / Yêu cầu đặt phòng trực tuyến sắp mở. Hiện bạn nhắn… OTTIMO trả lời… | **PHỄU** – "open soon / sắp mở" báo trang chưa xong, làm khách chần chừ. VI lặp OTTIMO | Message us your dates and the number of guests. We reply within 1 hour ([[07:00–22:00]]); outside these hours, before 09:00. | Nhắn ngày ở và số khách qua Zalo. Chúng tôi trả lời trong 1 giờ ([[07:00–22:00]]); ngoài giờ, trước 09:00 sáng hôm sau. |
| 8.10 | `book.chat.call` | Call / Gọi | Giữ | – | – |

### 8.11 Form (US-155 – chỉ hiện khi bật) – nhãn và gợi ý
| Khóa | Cũ (VI) | Vấn đề | Mới EN | Mới VI |
|---|---|---|---|---|
| `form.title` | Booking request / Yêu cầu đặt phòng | Giữ (đúng bản chất "yêu cầu") | – | – |
| `form.anyRoom` | Any room – suggest one / Hạng nào cũng được | VI nghe hờ hững | Any room – suggest one | Gợi ý giúp tôi |
| `form.reachYou` | How we reach you / Cách OTTIMO liên hệ bạn | **LỦNG** | – | Chúng tôi liên hệ bạn qua |
| `form.note` | Anything we should know? / Bạn muốn nhắn thêm gì? | Giữ | – | – |
| `form.noJs` | … / Form cần JavaScript. Bạn cũng có thể nhắn OTTIMO qua Zalo: | VI pha "Form" | – | Biểu mẫu cần JavaScript. Bạn cũng có thể nhắn chúng tôi qua Zalo: |
| `form.done.tonight` | Arriving tonight? Calling is fastest: / Đến trong tối nay? Gọi ngay cho nhanh: | VI suồng sã | – | Bạn đến ngay tối nay? Gọi chúng tôi để được hỗ trợ nhanh nhất: |
| `form.consent`, `consentMore`, `privacy`, `noteHint`, `phoneHint` | Câu pháp lý / an toàn | **Giữ** (SEC duyệt; chỉ chỉnh khi SEC đồng ý) | – | – |
| Các nhãn còn lại (`checkIn`, `adults`, `months`…) | Nhãn chức năng | Giữ | – | – |
| `booking-strings.ts` `roomHint` (EN) | Sleeps {lo}–{hi}. The higher number uses the sofa. | **Sai từ 22/10** (Premium có giường phụ 1,4 m) và là chỗ đúng để nói khách thêm | Sleeps {lo}–{hi}. The higher number includes one more guest, on the sofa or the Premium extra bed; we include it in your quote. | (bản VI tương ứng) Tối đa {lo}–{hi} khách. Số lớn hơn là khi thêm một khách, ngủ sofa hoặc giường phụ ở hạng Premium; chi phí đã gồm trong báo giá. |

## 9. Hỏi đáp (`#faq`)

| # | Khóa | Câu cũ (EN / VI) | Vấn đề | Câu mới EN | Câu mới VI |
|---|---|---|---|---|---|
| 9.1 | `faq.title` | Good to know / Cần biết trước khi đến | Giữ EN; VI dài, giọng thông báo | Good to know | Trước khi bạn đến |
| 9.2 | `faq.items[0]` | What kind of place is OTTIMO? · A boutique stay: a reception, check-in at 14:00 and check-out at 12:00, and daily housekeeping for short stays, in rooms with a full kitchen, a washer-dryer and a desk. Stay one night or several months. / OTTIMO là loại hình lưu trú nào? · … | **KÊ** – trả lời bằng danh sách; "kind of place" nghe hồ nghi | What is it like to stay at OTTIMO? · The attentiveness of a reception and, for short stays, daily housekeeping, with the ease of your own kitchen, washer-dryer and desk. Check-in from 14:00, check-out by 12:00. One night or several months, it simply works. | Ở OTTIMO thế nào? · Sự chu đáo của lễ tân và, với kỳ ở ngắn, dọn phòng mỗi ngày; cùng sự tiện lợi của gian bếp, máy giặt sấy và bàn làm việc riêng. Nhận phòng từ 14:00, trả phòng trước 12:00. Một đêm hay vài tháng, mọi thứ đều sẵn sàng. |
| 9.3 | `faq.items[1]` | Is housekeeping included? · Daily for short stays. Monthly stays choose a housekeeping plan that suits them. / Có dọn phòng không? · … | "Included" gợi chuyện tiền; câu 2 giọng thủ tục | How often is my room made up? · Every day for short stays. On a monthly stay, you choose the rhythm that suits you. | Phòng được dọn thế nào? · Mỗi ngày với kỳ ở ngắn. Ở theo tháng, bạn chọn lịch dọn phòng hợp với mình. |
| 9.4 | `faq.items[2]` (`faq-long`) | How do long stays work? · Choose "By the month" in the request. Monthly rates are quoted for you, less for longer terms. Utilities by meter, clear monthly terms, and support when you need it. / … Điện nước theo công tơ, điều khoản theo tháng rõ ràng… | **THẲNG** – "Utilities by meter / Điện nước theo công tơ" là chi tiết hợp đồng; "less for longer terms" giọng bảng giá | How do longer stays work? · Choose "By the month" in your request. We prepare a monthly rate for you, kinder the longer you stay, with every term set out clearly in your quote. And someone is always here when you need help. | Ở dài ngày thế nào? · Chọn "Theo tháng" khi gửi yêu cầu. Chúng tôi gửi giá theo tháng riêng cho bạn, ở càng lâu càng ưu đãi, mọi điều khoản ghi rõ trong báo giá. Và luôn có người hỗ trợ khi bạn cần. |
| 9.5 | `faq.items[3]` (`faq-real`) + `depositAccount` | How do I know a message is really from OTTIMO? … We never ask for card numbers. … / Làm sao biết tin nhắn đúng là của OTTIMO? … | **Giữ nguyên** – câu chống giả danh SEC (UXD-06), test khóa chữ "never ask for card numbers" / "không bao giờ hỏi số thẻ". Ở đây "OTTIMO" làm chủ ngữ là đúng (cần danh tính rõ) | – | – |

- 9.4 bỏ "công tơ" khỏi trang: concept N3 đặt câu này ở FAQ để minh bạch với khách ở dài. Đề xuất chuyển vào **báo giá tháng** (công cụ báo giá dài hạn đã có dòng điện nước) và tin sale – **DOM xác nhận** báo giá luôn ghi điện/nước trước khi khách cọc.

## 10. Liên hệ (`#contact`), chân trang, 404

| # | Khóa | Câu cũ (EN / VI) | Vấn đề | Câu mới EN | Câu mới VI |
|---|---|---|---|---|---|
| 10.1 | `contact.title` | Talk to us. / Trò chuyện với OTTIMO. | EN được nhưng nhạt; VI lặp OTTIMO | Just a message away. | Chỉ cách một tin nhắn. |
| 10.2 | `contact.intro` | A question about a room, a date or a long stay? Chat with us on Zalo. / Hỏi về phòng, ngày ở hay kỳ ở dài? Nhắn OTTIMO qua Zalo. | **NHẠT** | Dates, rooms, a longer stay: message us on Zalo and we will take care of the details. | Ngày ở, phòng nghỉ, một kỳ ở dài: nhắn chúng tôi qua Zalo, mọi chi tiết để chúng tôi lo. |
| 10.3 | `contact.otherChannels`, `otherText`, `facebookLink`, `mailSubject`, `privacy` | – | Giữ (FB-INV-002 ý 4, SEC) | – | – |
| 10.4 | `footer.*` | – | Giữ | – | – |
| 10.5 | `notFound.*` | We could not find this page. … | Giữ | – | – |

## 11. Ảnh hưởng tới mã và test (FE-LP làm sau khi duyệt – CPY không sửa)

| Chỗ | Ảnh hưởng | Ai |
|---|---|---|
| `copy.test.ts` "action labels are Request to book / Yêu cầu đặt phòng" | Đổi theo Q1 (nếu INV chọn "Plan your stay / Chọn ngày ở") | FE-LP, PO duyệt |
| `copy.test.ts` "Premium … rooms.note must match /Premium/" | Bỏ điều kiện với `rooms.note` (thông tin Premium chuyển sang `roomHint` của form) | FE-LP |
| `dist-checks.mjs` đếm "hotel/khách sạn" ≤ 3 | Câu mới = 0. Đề xuất hạ trần về 0 để giữ định vị | FE-LP, UXD |
| `dist-checks.mjs` danh sách cấm | Thêm: `/small hotel/i`, `/khách sạn nhỏ/iu`, `/phụ thu/iu`, `/extra-guest fee/i`, `/công tơ/iu` và `/by meter/i` (thân trang), `/sắp mở\|open soon/iu` | FE-LP |
| `booking-strings.ts` `roomHint` | Sửa câu (mục 8.11) – đang sai từ khi Premium có giường phụ | FE-LP |
| `concept.md` 2.1, 2.3, 2.4 (UXD) và `landing-positioning.md` 1.1 (DOM) | Câu định vị "the care of a small hotel" hết dùng; thay bằng câu nội bộ ở `concept.md` (CPY) mục 1 | UXD, DOM |
| Nút có chữ đúng bằng "Book"/"Đặt phòng" (dist-checks) | Câu mới không vi phạm | – |
| Độ dài | Hero lead +4% EN / +6% VI; meta 143/147 ≤ 160; thẻ phòng Garden, Premium, Signature +10–17% – UXD kiểm thẻ điện thoại | UXD |

## 12. E-brochure – câu cần sửa ở lần xuất sau (cùng lý do)

| Trang | Câu hiện có | Vấn đề | Hướng sửa |
|---|---|---|---|
| 1, 35 | Một căn hộ ở Đà Lạt — để ở lại một tháng, hay lâu hơn. / An apartment in Da Lat… | "căn hộ", chỉ nói khách dài | A refined stay inspired by the calm spirit of Dalat. / Stay for the mornings. |
| 2 | Khách sạn là để ghé. Ottimo là để ở. | Chê khách sạn, đẩy khách ngắn ngày đi | Stay a night, or a season. · Ở một đêm, hay trọn một mùa. |
| 3 | Move in, not check in. · "Ottimo là mười căn hộ…" · "not an extended hotel room" | Ngôn ngữ thuê nhà, lộ số căn | Viết lại theo mục 4 của bản này |
| 4–5 | Everything a home has — ready to move in. · "Chuẩn thiết bị resort 5 sao" · "Dunlopillo · chuẩn 5 sao" | "dọn vào", hạng sao (pháp lý LZ-9, brand) | The details you feel every day. · Dunlopillo, chosen for deep sleep |
| 6 | Bốn cách để ở lại Đà Lạt lâu hơn | Chỉ cho khách dài | Choose your window · Chọn khung cửa sổ của bạn |
| 8 | "Studio … cho một người ở dài ngày" | Thu hẹp khách | Câu thẻ phòng mục 5.5 |
