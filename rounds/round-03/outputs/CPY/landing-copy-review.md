# Câu chữ landing ottimo.vn – BẢN CHỐT cho FE-LP (concept B)

- Người viết: CPY | Round 3 – bước Sản xuất (viết lại theo quyết định INV 24/10) | Ngày: 24/10/2026
- Quyết định INV (dòng cuối `01-decisions/decision-log.md`):
  - concept **B "The art of staying well"**;
  - nút chính **Plan your stay / Chọn ngày ở**;
  - VI xưng **"chúng tôi"**, riêng câu chống giả danh và câu tiền cọc giữ "OTTIMO";
  - tên hạng **City Studio · Garden Studio · Premium One-Bedroom · Signature Two-Bedroom**;
  - bỏ "phụ thu", "công tơ" và chữ hotel/khách sạn khỏi thân trang; giữ "cọc 30%" ở mục đặt phòng.
- Bản này thay bản rà sáng 24/10 (theo concept A). Ý tưởng, thứ tự mục, CTA và ảnh xem `concept.md`.
- Phạm vi: `product/apps/landing-web/src/content/en.ts`, `vi.ts`, `site.json`, `src/scripts/booking-strings.ts`.
  - `site.json` **không đổi**: tagline giữ nguyên làm H1; số liệu `booking` vẫn khớp câu mới.
- Quy trình: UXD kiểm khung và brand → FE-LP áp cùng đợt thay ảnh đầu trang → QA chạy test → CPY đọc lại bản đã lên. CPY không sửa mã, không commit.

## Cách đọc bảng

| Ký hiệu | Nghĩa |
|---|---|
| Khóa | Đường dẫn trong đối tượng `Copy` (`en.ts` / `vi.ts`), hoặc tên hàm trong `BOOKING_STRINGS.en` / `.vi` |
| `[[…]]` | Giữ nguyên dấu mono như mã hiện tại |
| **MỚI** | Khóa chưa có: FE-LP thêm vào `types.ts` và component |
| Giữ | Không đổi chữ – liệt kê ở mục 13 |

Lý do đổi được ghi gọn bằng nhãn:

| Nhãn | Nghĩa |
|---|---|
| LOÃNG | Làm loãng định vị |
| THẲNG | Nói giá, phí, vận hành ở thân trang |
| KÊ | Kê thông số |
| LỦNG | Câu lủng củng, dịch cứng |
| NHẠT | Câu nhạt |
| PHỄU | Không dẫn khách tới hành động |
| B | Đổi theo concept B |
| XƯNG | Đổi "OTTIMO" thành "chúng tôi" |
| TÊN | Đổi tên hạng |

---

## 1. Meta

| Khóa | EN chốt | VI chốt | Lý do |
|---|---|---|---|
| `meta.description` | A boutique stay on a quiet Da Lat hillside, devoted to the art of staying well: deep sleep, calm rooms, everything at hand. Stay a night, or a season. *(150 ký tự)* | Boutique stay trên triền đồi yên tĩnh ở Đà Lạt: giấc ngủ sâu, không gian chỉn chu, mọi thứ sẵn sàng. Ở một đêm, hay trọn một mùa. Nhắn Zalo. *(140 ký tự)* | LOÃNG (câu cũ có "small hotel" / "khách sạn nhỏ"), KÊ, B |

## 2. Điều hướng và nút

| Khóa | EN chốt | VI chốt | Lý do |
|---|---|---|---|
| `nav.why` | The Stay | Kỳ lưu trú | NHẠT ("Why OTTIMO") |
| `nav.rooms` | Rooms (giữ) | Phòng nghỉ | VI mềm hơn "Hạng phòng" |
| `actions.requestToBook` | **Plan your stay** | **Chọn ngày ở** | INV chốt |
| `actions.chatOnZalo` | Chat on Zalo (giữ) | Nhắn qua Zalo | VI bỏ chữ "Chat" |
| `actions.chatOnPrefix` | Chat on (giữ) | `Nhắn qua ` | Như trên |

## 3. Hero

| Khóa | EN chốt | VI chốt | Lý do |
|---|---|---|---|
| `hero.lead` | Quiet, well-made rooms on a Da Lat hillside, where sleep comes easily and everything just works. *(96; cũ 83)* | Phòng nghỉ yên tĩnh, chỉn chu trên triền đồi Đà Lạt, nơi giấc ngủ đến dễ dàng và mọi thứ vận hành êm ái. *(104; cũ 93)* | LOÃNG ("small hotel"), KÊ (bếp, máy giặt, bàn), B. Dài hơn 16% / 12% – UXD kiểm |
| `hero.label`, H1 (`site.json` `tagline`) | Giữ | Giữ | – |

## 4. The Stay (`#why`)

| Khóa | EN chốt | VI chốt | Lý do |
|---|---|---|---|
| `why.label` | The Stay | Kỳ lưu trú | NHẠT |
| `why.title` | **The art of staying well.** | **Nghệ thuật lưu trú an yên.** | B |
| `why.intro` | It begins with small things done right, every day: crisp linen, a quiet that holds, light on warm oak. Stay a night, or a season. | Bắt đầu từ những điều nhỏ được làm đúng, mỗi ngày: chăn ga phẳng phiu, sự yên tĩnh trọn vẹn, ánh sáng trên sắc gỗ sồi. Ở một đêm, hay trọn một mùa. | NHẠT ("one standard of care"), B |
| `why.short.label` | For a few nights (giữ) | Cho vài đêm | LỦNG |
| `why.short.title` | Room to breathe, even for a night | Rộng rãi, dù chỉ một đêm | LOÃNG ("Beyond what a hotel room gives you"), LỦNG |
| `why.short.body` | A quiet room, a bed made for deep sleep, housekeeping every day. Then the surprise: more space than you planned for, and a balcony of your own. | Phòng yên tĩnh, giường cho giấc ngủ sâu, dọn phòng mỗi ngày. Rồi một điều bất ngờ: rộng hơn bạn nghĩ, và ban công là của riêng bạn. | THẲNG (bỏ "Check in at 14:00" ở câu mở) |
| `why.long.label` | For a month, or longer (giữ) | Cho một tháng, hay lâu hơn | LỦNG |
| `why.long.title` | A season, lived well | Một mùa Đà Lạt, sống thong thả | NHẠT, B |
| `why.long.body` | Unpack once and find your rhythm: market mornings, dinners from your own kitchen, quiet hours of work by the window, laundry done without leaving the room. Everything shaped around how you live. | Dỡ vali một lần rồi sống theo nhịp của mình: sáng ghé chợ, tối nấu bữa cơm trong gian bếp riêng, những giờ làm việc yên tĩnh bên cửa sổ, giặt sấy ngay trong phòng. Mọi thứ theo cách bạn sống. | THẲNG ("Monthly rates and a housekeeping plan"). Bếp và máy giặt sấy chuyển từ hero xuống đây |
| `why.more` **MỚI** (link chữ → `#rooms`) | See the rooms | Xem các phòng | PHỄU |

- `#why` không có "meter/công tơ" – dist-checks qua.

## 5. Phòng nghỉ (`#rooms`)

| Khóa | EN chốt | VI chốt | Lý do |
|---|---|---|---|
| `rooms.label` | Rooms (giữ) | Phòng nghỉ | – |
| `rooms.title` | **Choose your window** | **Chọn khung cửa sổ của bạn** | NHẠT ("Four ways to stay") |
| `rooms.intro` | City lights or garden green. A studio for two, or two bedrooms for the whole family. | Phố lên đèn hay vườn xanh trước mặt. Studio cho hai người, hoặc hai phòng ngủ cho cả gia đình. | KÊ |
| `rooms.request` | Ask about this room | Nhận báo giá phòng này | PHỄU |
| `rooms.items[0].name` / `shortName` | City Studio | Studio hướng phố | TÊN |
| `rooms.items[0].altName.text` | Studio hướng phố (`lang: 'vi'`) | City Studio (`lang: 'en'`) | TÊN |
| `rooms.items[0].desc` | Da Lat glows beyond the glass at night. Right for a weekend; right for a month. | Đêm xuống, Đà Lạt lên đèn ngay sau khung kính. Vừa vặn cho một cuối tuần, trọn vẹn cho một tháng. | NHẠT ("Easy… easy") |
| `rooms.items[1].name` / `shortName` | Garden Studio | Studio hướng vườn | TÊN |
| `rooms.items[1].altName.text` | Studio hướng vườn | Garden Studio | TÊN |
| `rooms.items[1].desc` | Wake to green beyond the glass and a balcony of your own. Morning light for a short stay; a quiet desk for the weeks that follow. | Thức dậy giữa sắc xanh sau khung kính, ban công là của riêng bạn. Nắng sớm cho chuyến đi ngắn; góc làm việc yên tĩnh cho những tuần ở lại. | Thêm người vào cảnh |
| `rooms.items[2].name` / `shortName` | Premium One-Bedroom | Premium một phòng ngủ | TÊN ("+ 1" khó hiểu) |
| `rooms.items[2].altName.text` | Premium một phòng ngủ | Premium One-Bedroom | TÊN |
| `rooms.items[2].desc` | A separate bedroom and living room, a long navy kitchen and a [[1.4 m]] extra bed for one more. A suite for a short stay; room for family on a long one. | Phòng ngủ, phòng khách tách riêng, gian bếp navy dài và giường phụ [[1,4 m]] cho thêm một người. Như một suite khi ở ngắn; đủ chỗ đón người thân khi ở lâu. | KÊ. Giữ "1.4 m extra bed" / "giường phụ 1,4 m" vì test có kiểm |
| `rooms.items[3].name` / `shortName` | Signature Two-Bedroom | Signature hai phòng ngủ | TÊN |
| `rooms.items[3].altName.text` | Signature hai phòng ngủ | Signature Two-Bedroom | TÊN |
| `rooms.items[3].desc` | Two bedrooms, a table for four and a balcony that holds the sunset. One stay for the whole family, or for two who work remotely through a season. | Hai phòng ngủ, bàn ăn bốn người và ban công đón hoàng hôn. Một kỳ nghỉ cho cả gia đình, hoặc cho hai người làm việc từ xa suốt một mùa. | Giọng giao dịch ("One booking") |
| `rooms.note` | Room for one more guest on request. Rates by the night or by the month, prepared for your dates. | Có thể thêm một khách theo yêu cầu. Giá theo đêm hoặc theo tháng, báo riêng theo ngày ở của bạn. | **THẲNG** – bỏ "extra-guest fee" / "(có phụ thu)". Chi tiết sofa, giường phụ chuyển sang `roomHint` (mục 8.2) |

- `slug`, `sleeps`, `size`, `view`, `photo`: giữ.
- Desk giữ tên hạng cũ.
- `src/assets/photos/CREDITS.md` vẫn ghi tên cũ. Đó là tài liệu nội bộ, đổi hay không tùy FE-LP.

## 6. Tiện nghi (`#amenities`)

| Khóa | EN chốt | VI chốt | Lý do |
|---|---|---|---|
| `amenities.title` | **Staying well, in every detail.** | **Lưu trú an yên, từ những chi tiết nhỏ.** | B |
| `amenities.intro` | Small luxuries for one night. The essentials for a month. (giữ) | Ở một đêm, đó là sự chiều chuộng. Ở một tháng, đó là điều cần có. | LỦNG ("thì là… thì là") |
| `amenities.groups[0].title` | Sleep well | Ngủ ngon | B |
| `amenities.groups[0].body` | Dunlopillo mattress and fine bedding, chosen for deep sleep. Ceiling air conditioning that never blows at the bed. | Nệm và chăn ga Dunlopillo, chọn cho giấc ngủ sâu. Điều hòa âm trần, không thổi thẳng vào giường. | LOÃNG ("Hotel-grade" / "chuẩn khách sạn") |
| `amenities.groups[1].title` | Live well | Sống thong thả | B |
| `amenities.groups[1].body` | Hafele induction hob, a Samsung [[280 L]] fridge, microwave and kettle. Your own Electrolux washer and dryer, in the room. | Bếp từ Hafele, tủ lạnh Samsung [[280 lít]], lò vi sóng, ấm đun. Máy giặt và máy sấy Electrolux của riêng bạn, ngay trong phòng. | Cảm giác sở hữu |
| `amenities.groups[2].title` | Work well | Làm việc tập trung | B |
| `amenities.groups[2].body` | A [[1 Gbps]] fibre line, a desk by the window, a [[55-inch]] 4K TV and a hot rain shower. (giữ) | Giữ | – |
| `amenities.groups[3].title` | Come and go freely | Đi về tự do | B |
| `amenities.groups[3].body` | A warm welcome at the ground-floor reception, [[07:00–22:00]], and a smart lock for late arrivals. Check-in from 14:00, check-out by 12:00. | Lễ tân đón bạn ở tầng trệt, [[07:00–22:00]]; khóa điện tử để bạn đến muộn vẫn thong thả. Nhận phòng từ 14:00, trả phòng trước 12:00. | THẲNG nhẹ. Giữ giờ lễ tân vì test có kiểm |

## 7. Vị trí (`#location`)

| Khóa | EN chốt | VI chốt | Lý do |
|---|---|---|---|
| `location.intro` | Come home to quiet. The market, the cafés and Xuan Huong Lake are a short drive away. | Về đến là yên tĩnh. Chợ, những quán cà phê và hồ Xuân Hương chỉ cách vài phút đi xe. | LỦNG (VI cũ "Về là yên tĩnh") |
| `location.ask` **MỚI** (link chữ → `#book`) | Ask us about your dates | Hỏi chúng tôi về ngày ở | PHỄU |
| `location.title`, `rows`, `caption`, `head`, `note`, `maps`, `copy`, `copied`, `copyFailed` | Giữ | Giữ | – |

## 8. Đặt phòng (`#book`) – phần để lại yêu cầu

### 8.1 Thân mục

| Khóa | EN chốt | VI chốt | Lý do |
|---|---|---|---|
| `book.label` | Book direct (giữ) | Đặt trực tiếp (giữ) | – |
| `book.title` | **Plan your stay** | **Lên kế hoạch cho kỳ nghỉ** | INV chốt CTA |
| `book.intro` | Share your dates and how you like to travel. We will suggest the right room and prepare a rate for your stay. | Cho chúng tôi biết ngày bạn đến và cách bạn muốn ở. Chúng tôi sẽ gợi ý phòng phù hợp và gửi báo giá riêng cho bạn. | XƯNG, LỦNG |
| `book.steps[0].title` / `.text` | Share your dates / Dates, guests and the room you have in mind. | Gửi ngày ở / Ngày ở, số khách và phòng bạn thích. | – |
| `book.steps[1].title` / `.text` | We reply on Zalo / Within 1 hour ([[07:00–22:00]], Da Lat time); outside these hours, before 09:00 the next morning. | Chúng tôi trả lời qua Zalo / Trong 1 giờ ([[07:00–22:00]], giờ Đà Lạt); ngoài giờ, trước 09:00 sáng hôm sau. | Chữ "confirm" dễ hiểu nhầm là đặt chắc (trái phương án A). XƯNG |
| `book.steps[2].title` / `.text` | Your room, held for you / When the quote feels right, a 30% deposit by QR transfer holds your room. | Giữ phòng cho bạn / Khi bạn ưng báo giá, OTTIMO giữ phòng cho bạn sau khi nhận cọc 30% qua mã QR. | Câu tiền cọc: VI **giữ "OTTIMO"** (INV). Giữ 30% |
| `book.reassure` | Nothing to pay here, and no commitment until you say yes. | Không thanh toán trên trang này, và không ràng buộc gì cho đến khi bạn đồng ý. | Ấm hơn, cùng nghĩa |
| `book.chat.title` | Send your dates on Zalo (giữ) | Gửi ngày ở qua Zalo (giữ) | – |
| `book.chat.text` | Message us your dates and the number of guests. We reply within 1 hour ([[07:00–22:00]]); outside these hours, before 09:00. | Nhắn ngày ở và số khách qua Zalo. Chúng tôi trả lời trong 1 giờ ([[07:00–22:00]]); ngoài giờ, trước 09:00 sáng hôm sau. | PHỄU (bỏ "open soon" / "sắp mở"), XƯNG |

### 8.2 Form (`book.form.*`) và `booking-strings.ts`

| Khóa | EN chốt | VI chốt | Lý do |
|---|---|---|---|
| `book.form.anyRoom` | Any room – suggest one (giữ) | Gợi ý giúp tôi | VI hờ hững |
| `book.form.reachYou` | How we reach you (giữ) | Chúng tôi liên hệ bạn qua | XƯNG |
| `book.form.noJs` | Giữ | Biểu mẫu cần JavaScript. Bạn cũng có thể nhắn chúng tôi qua Zalo: | XƯNG, bỏ chữ "Form" |
| `book.form.done.tonight` | Giữ | Bạn đến ngay tối nay? Gọi chúng tôi để được hỗ trợ nhanh nhất: | Câu cũ suồng sã |
| **`roomHint(lo, hi)`** – có sức chứa | `Sleeps ${lo}–${hi}. The higher number includes one more guest (sofa, or the 1.4 m extra bed in Premium), included in your quote.` | `${lo}–${hi} khách. Số lớn hơn là khi thêm một khách (ngủ sofa, hoặc giường phụ 1,4 m ở hạng Premium); chi phí đã gồm trong báo giá.` | **Sửa lỗi**: câu cũ "uses the sofa" sai từ 22/10 vì Premium có giường phụ 1,4 m. Thông tin khách thêm chuyển về đây, không dùng chữ "phụ thu". Chuỗi gán bằng `textContent` nên không dùng `[[ ]]` |
| `roomHint(null)` | We suggest a room that suits your group. (giữ) | Chúng tôi sẽ gợi ý phòng hợp với số khách. | XƯNG |
| `longHint(n)` | Giữ | `${n} đêm. Chúng tôi sẽ báo giá ở dài ngày.` | XƯNG |
| `next.zalo` | Giữ | Giữ ("…gửi mã này cho OTTIMO") | Giữ "OTTIMO" để khách gửi đúng tài khoản Zalo (chống giả danh) |
| `next.whatsapp` / `phone` / `email` | Giữ | Chúng tôi sẽ nhắn bạn qua WhatsApp. / Chúng tôi sẽ gọi cho bạn. / Chúng tôi sẽ trả lời qua email. | XƯNG |
| `when.withinMinutes` | Giữ | `Chúng tôi trả lời trong ${…} (${open}–${close}, giờ Đà Lạt).` | XƯNG; test "1 giờ" vẫn qua |
| `when.nextMorning` | Giữ | `Lễ tân làm việc lại từ ${open}. Chúng tôi sẽ trả lời bạn trước ${by}.` | XƯNG |
| `when.callNow` | Giữ | `Bạn đến trong tối nay, chúng tôi sẽ liên hệ bạn trong ${m} phút.` | XƯNG |
| `fallback` | Giữ | `['Nếu đến ', ' chúng tôi chưa liên hệ, vui lòng gọi ', ' hoặc nhắn Zalo kèm mã này.']` | XƯNG |
| `e.cap(n)` | Giữ (vẫn "Any room") | `…Chọn hạng lớn hơn, hoặc "Gợi ý giúp tôi".` | Theo `anyRoom` mới |
| `e.name` / `e.phone(c)` / `e.consent` | Giữ | Cho chúng tôi biết tên của bạn. / `Nhập số ${c} để chúng tôi liên hệ.` / Vui lòng đánh dấu ô đồng ý để chúng tôi trả lời. | XƯNG |
| `net.network` / `net.busy` / `net.rate` | Giữ | …hoặc nhắn chúng tôi qua Zalo. / Chúng tôi đang nhận nhiều yêu cầu. Vui lòng nhắn Zalo hoặc gọi 08.4444.0909. / …hoặc nhắn chúng tôi qua Zalo. | XƯNG |
| `notSent` (chỉ ở bản xem trước) | Preview: this request was not sent. Please chat with us on Zalo. | Bản xem trước: yêu cầu chưa được gửi. Vui lòng nhắn chúng tôi qua Zalo. | Bỏ "open soon" / "sắp mở" |
| `book.form.consent`, `consentMore`, `privacy`, `noteHint`, `phoneHint` | **Giữ** | **Giữ** (vẫn "OTTIMO") | Câu pháp lý SEC đã duyệt |

## 9. Hỏi đáp (`#faq`)

| Khóa | EN chốt | VI chốt | Lý do |
|---|---|---|---|
| `faq.title` | Good to know (giữ) | Trước khi bạn đến | VI giọng thông báo |
| `faq.items[0].q` | What is it like to stay at OTTIMO? | Ở OTTIMO thế nào? | Câu cũ nghe hồ nghi ("What kind of place") |
| `faq.items[0].a[0]` | The attentiveness of a reception and, for short stays, daily housekeeping, with the ease of your own kitchen, washer-dryer and desk. Check-in from 14:00, check-out by 12:00. One night or several months, it simply works. | Sự chu đáo của lễ tân và, với kỳ ở ngắn, dọn phòng mỗi ngày; cùng sự tiện lợi của gian bếp, máy giặt sấy và bàn làm việc riêng. Nhận phòng từ 14:00, trả phòng trước 12:00. Một đêm hay vài tháng, mọi thứ đều sẵn sàng. | KÊ, B |
| `faq.items[1].q` | How often is my room made up? | Phòng được dọn thế nào? | "Included" gợi chuyện tiền |
| `faq.items[1].a[0]` | Every day for short stays. On a monthly stay, you choose the rhythm that suits you. | Mỗi ngày với kỳ ở ngắn. Ở theo tháng, bạn chọn lịch dọn phòng hợp với mình. | THẲNG nhẹ |
| `faq.items[2].q` (`faq-long`) | How do longer stays work? | Ở dài ngày thế nào? (giữ) | – |
| `faq.items[2].a[0]` | Choose "By the month" in your request. We prepare a monthly rate for you, kinder the longer you stay, with every term set out clearly in your quote. And someone is always here when you need help. | Chọn "Theo tháng" khi gửi yêu cầu. Chúng tôi gửi giá theo tháng riêng cho bạn, ở càng lâu càng ưu đãi, mọi điều khoản ghi rõ trong báo giá. Và luôn có người hỗ trợ khi bạn cần. | **THẲNG** – bỏ "Utilities by meter" / "Điện nước theo công tơ" (INV). DOM xác nhận báo giá tháng luôn ghi điện nước |
| `faq.items[3]` (`faq-real`), `faq.depositAccount` | **Giữ** | **Giữ** (vẫn "OTTIMO") | Câu chống giả danh và câu tiền cọc (SEC UXD-06, INV) |

## 10. Liên hệ

| Khóa | EN chốt | VI chốt | Lý do |
|---|---|---|---|
| `contact.title` | Just a message away. | Chỉ cách một tin nhắn. | NHẠT, XƯNG ("Trò chuyện với OTTIMO") |
| `contact.intro` | Dates, rooms, a longer stay: message us on Zalo and we will take care of the details. | Ngày ở, phòng nghỉ, một kỳ ở dài: nhắn chúng tôi qua Zalo, mọi chi tiết để chúng tôi lo. | NHẠT, XƯNG |
| `contact.facebookLink`, `mailSubject`, `otherChannels`, `otherText`, `privacy` | Giữ | Giữ | Tên riêng và kênh – để "OTTIMO" là đúng |

## 11. Ảnh (alt) khi thay ảnh đầu trang
- Ảnh mới cho slider (đề xuất ở `concept.md` mục 7) phải có trong `manifest.json` và có `photoAlt` EN + VI (test R3-Q52).
- Alt mô tả đúng ảnh, giọng mới:
  - không có chữ "căn" (test đã chặn);
  - không có "apartment";
  - không nhắc số lượng phòng.
- UXD giữ quyền a11y.
- Đổi slide 1 sang ảnh số 4: thay tệp nhưng **giữ id `hero-facade-dusk`**. Alt hiện tại "OTTIMO at dusk, with warm lights on every balcony" vẫn đúng.

## 12. Test FE-LP phải đổi

### 12.1 `src/content/copy.test.ts`

| Test | Đổi |
|---|---|
| `the action labels are "Request to book" / "Yêu cầu đặt phòng" (concept T5)` (dòng 156–159) | Sửa thành `expect(en.actions.requestToBook).toBe('Plan your stay')` và `expect(vi.actions.requestToBook).toBe('Chọn ngày ở')`. Đổi tên test. Tên khóa `requestToBook` có thể giữ để ít đổi mã |
| `Premium has the 1.4 m extra bed (INV 22/10)…` | **Bỏ** `expect(c.rooms.note).toMatch(/Premium/)`. Giữ hai kiểm tra trên `desc`. **Thêm:** `BOOKING_STRINGS.en.roomHint('2','3')` chứa `1.4 m extra bed`; `BOOKING_STRINGS.vi.roomHint('2','3')` chứa `giường phụ 1,4 m` |
| `both languages fill exactly the same fields` | Tự kiểm khóa mới `why.more`, `location.ask` sau khi thêm vào `types.ts` và hai file |
| `every photo used by the copy has an alt text…`; `R3-Q52: hero slides…` | Không đổi chữ test. Nếu thay slider thì cập nhật `HERO_SLIDES` (≥ 3 ảnh, không trùng, slide 1 = `hero-facade-dusk`); ảnh mới phải có trong manifest và có alt hai thứ tiếng |
| `numbers stated on the page = site.json` | Không đổi: `steps[1]` vẫn có 07:00–22:00, 09:00, "1 hour"/"1 giờ"; `steps[2]` vẫn có 30%; `chat.text` và `amenities.groups[3].body` vẫn có giờ lễ tân |
| `thank-you strings follow the 202 promise` | Không đổi: VI "Chúng tôi trả lời trong 1 giờ" vẫn khớp `/1 (hour|giờ)/` |
| **Thêm mới (đề xuất):** | Không có chữ "OTTIMO" ở `vi.book.intro`, `vi.book.chat.text`, `vi.contact.title/intro`. **Có** "OTTIMO" ở `vi.book.steps[2].text` và `vi.faq.items` có `deposit` (khóa quyết định INV) |

### 12.2 `scripts/dist-checks.mjs` (và ca thử trong `src/checks/dist-checks.test.ts`)

| Chỗ | Đổi |
|---|---|
| `BANNED` (dòng 267) | **Thêm:** `/small hotel/i`, `/khách sạn nhỏ/iu`, `/phụ thu/iu`, `/extra-guest fee/i`, `/\bby meter\b/i`, `/công tơ/iu`, `/open soon/i`, `/sắp mở/iu`, `/\bStandard Studio\b/`, `/One Bedroom \+ 1/` |
| Đếm "hotel/khách sạn" (dòng 311–313, đang cho ≤ 3) | Hạ về **0**: trang không còn chữ hotel/khách sạn (INV). Cập nhật thông báo lỗi và ca thử tương ứng |
| Kiểm nhãn nút đúng bằng "Book"/"Đặt phòng" | Giữ – nhãn mới không vi phạm |
| `src/checks/dist.test.ts` dòng 46 (tên test "hotel only as comparison") | Đổi tên/nội dung theo luật mới "no hotel wording" |

### 12.3 Chú thích trong mã (không chặn, nên sửa cho khớp)
- Các comment còn ghi "Request to book" hoặc "Why OTTIMO":
  - `types.ts:99`;
  - `Hero.astro`, `StickyBar.astro`, `Header.astro`, `Book.astro`, `Why.astro`;
  - `landing.css:733`, `landing.css:1799`.
- `en.ts`/`vi.ts` dòng đầu còn ghi "Text = UXD mock v1.2.1". Sửa thành "CPY bản chốt 24/10, concept B".

### 12.4 Tài liệu thiết kế
- UXD sửa `product/design/landing/concept.md` mục 2.1, 2.3, 2.4: thôi dùng câu định vị "the care of a small hotel"; bỏ quy tắc "hotel tối đa 3 so sánh".
- DOM ghi chú `landing-positioning.md` mục 1.1: câu định vị nội bộ mới ở `concept.md` (CPY) mục 1.

## 13. Giữ nguyên (không đổi chữ)
- **Meta và đầu trang:** `meta.title`, `meta.ogImageAlt`, `skip`, `hero.label`.
- **Điều hướng:**
  - `nav.label`, `mobileLabel`, `menu`;
  - `nav.amenities`, `location`, `faq`, `contact`;
  - EN `nav.rooms`.
- **Ngôn ngữ và nút:** `langSwitch.*`, `langSuggest.*`, `actions.newTab`.
- **Ảnh:**
  - `photoAlt.*` – trừ ảnh mới thêm (mục 11);
  - `carousel.*`, `gallery.*`.
- **Phòng:** `rooms.sleeps`, `rooms.items[].view`, `slug`, `size`, `sleeps`, `photo`.
- **Vị trí:** `location.*` – trừ `intro` và khóa mới `ask`.
- **Form:** mọi nhãn chức năng trong `book.form.*` không có ở mục 8.2.
- **FAQ:** `faq.items[3]` và `faq.depositAccount`.
- **Liên hệ và cuối trang:**
  - các khóa liên hệ ở mục 10 dòng cuối;
  - `footer.*`, `sticky.label`, `notFound.*`.
- **Dữ liệu và chuỗi động:**
  - toàn bộ `site.json`;
  - phần EN của `booking-strings.ts`, trừ `roomHint` và `notSent`.

## 14. Kiểm tay của CPY trên câu chốt
- Không còn từ cấm:
  - small hotel, hotel, khách sạn, phụ thu, công tơ, căn, căn hộ, apartment, lease, thuê tháng, mười, 5 sao, sang trọng;
  - không có dấu "!", emoji hay chữ IN HOA.
- Meta 150/140 ký tự (giới hạn 160).
- Số liệu khớp `site.json` và `business-rules.md`:
  - 07:00–22:00, 1 giờ, 09:00, 30%, 14:00 / 12:00;
  - 280 L, 1 Gbps, 55 inch, 1,4 m.
- Không hứa thứ chưa có: không quầy cà phê, bữa sáng, đưa đón, đỗ xe.
- Độ dài tăng so với bản cũ:
  - hero lead +16% (EN) / +12% (VI);
  - thẻ Garden, Premium, Signature +10–17%;
  - `why.long.body` +25%.
  - **UXD kiểm khung trên điện thoại 360 px.** Nếu quá dài, CPY có bản ngắn: bỏ câu cuối của `why.long.body` ("Everything shaped around how you live." / "Mọi thứ theo cách bạn sống.").
