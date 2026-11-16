# FB-INV-010 Đợt 1 – Câu chữ landing chỉ bán thuê dài hạn (CPY)

- Round 5 – Sản xuất | Tác giả: CPY | Ngày: 16/11/2026 | Nguồn: `04-investor-feedback/FB-INV-010.md`, `rounds/round-05/fb-inv-010/plan-dot-1.md`, brand guideline.
- Phạm vi: `product/apps/landing-web/src/content/{en,vi,ko,zh,ru}.ts` (gọi tắt **C**) và `src/scripts/booking-strings/{en,vi,ko,zh,ru}.ts` (gọi tắt **B**). Không sửa code; FE áp chữ.
- Ký hiệu cột TT: **ĐỔI** (đổi chữ), **NEW** (khóa mới), **REMOVE** (bỏ khóa), **GIỮ** (giữ nguyên, ghi để FE khỏi hỏi). `—` = không có.
- Nguyên tắc: EN dẫn; VI/KO/ZH/RU viết lại cho tự nhiên. Không emoji, không "!", không từ cấm (`BANNED` trong `scripts/dist-checks.mjs` – đã rà: không "lease", "thuê tháng", "hợp đồng theo tháng", "công tơ", "by meter", "phụ thu", "apartment/căn hộ/公寓/апартамент/квартир"…). Không con số nào ngoài số INV đưa: tối thiểu 1 tháng, cọc 1 tháng, điện 4.000 VND/kWh, nước 25.000 VND/m³, chốt ngày cuối tháng, thanh toán trước ngày 5.
- `{amount}` = FE chèn số đã định dạng kèm đơn vị (formatVnd, có U+00A0 giữa số và "VND"). ` ` = khoảng trắng không ngắt.
- Tên hạng phòng **giữ tên đang chạy** (INV 24/10, test `room type names`): City Studio, Garden Studio, Premium One-Bedroom, Signature Two-Bedroom (VI: Studio hướng phố / hướng vườn…). "Studio City / Studio Garden" trong FB-INV-010 là cách INV gọi tắt, không đổi tên trên web.

---

## 1. Meta, hero, phần giới thiệu (C)

| Khóa | TT | Ngôn ngữ | Cũ | Mới |
|---|---|---|---|---|
| `meta.description` | ĐỔI | EN | A boutique stay on a quiet Da Lat hillside, devoted to the art of staying well: … Stay a night, or a season. | A boutique stay on a quiet Da Lat hillside, made for living well by the month: deep sleep, a kitchen of your own, a desk by the window. |
| | | VI | … Ở một đêm, hay trọn một mùa. Nhắn Zalo. | Boutique stay trên triền đồi yên tĩnh ở Đà Lạt, cho kỳ ở từ một tháng: giấc ngủ sâu, bếp riêng, bàn làm việc bên cửa sổ. Nhắn Zalo. |
| | | KO | … 하룻밤도, 한 계절도. | 달랏의 고요한 언덕 위, 한 달 이상 머무는 분을 위한 부티크 스테이. 깊은 잠, 나만의 주방, 창가의 책상. 한 달도, 한 계절도. |
| | | ZH | … 住一晚，或住一季。 | 大叻静谧山坡上的精品住宿，为住一个月以上的您而设：安稳的睡眠，专属厨房，窗边书桌。住一个月，或住一季。 |
| | | RU | … Останьтесь на ночь — или на целый сезон. | Boutique stay на тихом склоне холма в Далате — для проживания от месяца: глубокий сон, своя кухня, стол у окна. На месяц или на целый сезон. |
| `hero.label` | GIỮ | 5 ngôn ngữ | Boutique stay · Da Lat … | (giữ) |
| `hero.lead` | ĐỔI | EN | Quiet, well-made rooms on a Da Lat hillside, where sleep comes easily and everything just works. | Quiet, well-made rooms on a Da Lat hillside, for a month or a season. Unpack once, and everything just works. |
| | | VI | Phòng nghỉ yên tĩnh, chỉn chu trên triền đồi Đà Lạt, nơi giấc ngủ đến dễ dàng… | Phòng nghỉ yên tĩnh, chỉn chu trên triền đồi Đà Lạt, cho một tháng hay trọn một mùa. Dỡ vali một lần, mọi thứ vận hành êm ái. |
| | | KO | 달랏 언덕 위, 고요하고 정갈한 객실. 잠은 쉬이 들고… | 달랏 언덕 위, 고요하고 정갈한 객실. 한 달, 혹은 한 계절. 짐은 한 번만 풀고, 모든 것은 막힘없이 흘러갑니다. |
| | | ZH | 大叻山坡上，安静而用心的客房。在这里，入眠不难… | 大叻山坡上，安静而用心的客房，住一个月，或住一季。行李只需打开一次，一切自然顺畅。 |
| | | RU | Тихие, продуманные до мелочей номера… здесь легко засыпается… | Тихие, продуманные до мелочей номера на склоне холма в Далате — на месяц или на целый сезон. Распакуйтесь один раз: всё просто работает. |
| `why.label`, `why.title`, `why.more` | GIỮ | 5 ngôn ngữ | | (giữ) |
| `why.intro` | ĐỔI (chỉ câu cuối) | EN | … light on warm oak. Stay a night, or a season. | … light on warm oak. Stay a month, or a season. |
| | | VI | … Ở một đêm, hay trọn một mùa. | … Ở một tháng, hay trọn một mùa. |
| | | KO | … 하룻밤도, 한 계절도. | … 한 달도, 한 계절도. |
| | | ZH | … 住一晚，或住一季。 | … 住一个月，或住一季。 |
| | | RU | … На одну ночь или на целый сезон. | … На месяц или на целый сезон. |
| `why.short.label` | ĐỔI | EN | For a few nights | For a month |
| | | VI | Cho vài đêm | Cho một tháng |
| | | KO | 며칠 머문다면 | 한 달 머문다면 |
| | | ZH | 小住几晚 | 住一个月 |
| | | RU | На несколько ночей | На месяц |
| `why.short.title` | ĐỔI | EN | Room to breathe, even for a night | Settled in from day one |
| | | VI | Rộng rãi, dù chỉ một đêm | Ổn định từ ngày đầu |
| | | KO | 하룻밤이라도, 여유롭게 | 첫날부터 내 공간처럼 |
| | | ZH | 即便一晚，也住得宽敞 | 入住第一天，便安顿下来 |
| | | RU | Простор даже на одну ночь | Как дома с первого дня |
| `why.short.body` | ĐỔI | EN | A quiet room, a bed made for deep sleep, housekeeping every day. Then the surprise… | A quiet room, a bed made for deep sleep, the furniture already in place. Bring your suitcase; the rest is here. |
| | | VI | Phòng yên tĩnh, giường cho giấc ngủ sâu, dọn phòng mỗi ngày… | Phòng yên tĩnh, giường cho giấc ngủ sâu, nội thất đã sẵn. Bạn chỉ cần mang vali; phần còn lại đã có ở đây. |
| | | KO | 조용한 객실, 깊은 잠을 위한 침대, 매일의 하우스키핑… | 조용한 객실, 깊은 잠을 위한 침대, 이미 갖춰진 가구. 가방만 가져오세요. 나머지는 여기 있습니다. |
| | | ZH | 安静的房间，为深睡而备的床，每日客房清洁… | 安静的房间，为深睡而备的床，家具一应俱全。带上行李箱即可，其余都已备好。 |
| | | RU | Тихий номер, кровать для глубокого сна, уборка каждый день… | Тихий номер, кровать для глубокого сна, мебель уже на месте. Возьмите чемодан — остальное здесь. |
| `why.long.label` | ĐỔI | EN | For a month, or longer | For a season, or longer |
| | | VI | Cho một tháng, hay lâu hơn | Cho một mùa, hay lâu hơn |
| | | KO | 한 달, 혹은 그 이상 | 한 계절, 혹은 그 이상 |
| | | ZH | 住一个月，或更久 | 住一季，或更久 |
| | | RU | На месяц или дольше | На сезон или дольше |
| `why.long.title`, `why.long.body` | GIỮ | 5 ngôn ngữ | A season, lived well / Unpack once… | (giữ – đã đúng hướng dài hạn) |

Ghi chú FE: hai thẻ vẫn dùng khóa `why.short` / `why.long` (không cần đổi tên khóa; nếu đổi thì `short` → `month`, `long` → `season`, kèm sửa `types.ts` và test ảnh). Ảnh giữ nguyên.

## 2. Phòng (C)

| Khóa | TT | Ngôn ngữ | Cũ | Mới |
|---|---|---|---|---|
| `rooms.label`, `rooms.title`, `rooms.intro`, `rooms.request`, `rooms.sleeps` | GIỮ | 5 ngôn ngữ | | (giữ) |
| `rooms.fromPrice` | NEW `(amount) => string` | EN | — | `From ${amount} / month` |
| | | VI | — | `Từ ${amount}/tháng` |
| | | KO | — | `월 ${amount}부터` |
| | | ZH | — | `每月 ${amount} 起` |
| | | RU | — | `От ${amount} в месяц` |
| `rooms.priceNote` | NEW | EN | — | Final rate confirmed when we contact you. Electricity and water billed on actual use. |
| | | VI | — | Giá chính thức xác nhận khi chúng tôi liên hệ. Điện nước tính theo thực tế. |
| | | KO | — | 최종 요금은 연락드릴 때 확정됩니다. 전기·수도는 실제 사용량대로 청구됩니다. |
| | | ZH | — | 最终价格在我们联系您时确认。水电按实际用量计费。 |
| | | RU | — | Итоговую цену подтвердим, когда свяжемся с вами. Электричество и вода — по фактическому расходу. |
| `rooms.priceFallback` | NEW (khi API không trả giá cho hạng đó) | EN | — | Monthly rate on request |
| | | VI | — | Giá theo tháng: báo khi bạn hỏi |
| | | KO | — | 월 요금은 문의 시 안내 |
| | | ZH | — | 按月价格欢迎咨询 |
| | | RU | — | Цена за месяц — по запросу |
| `rooms.items[0].desc` (City Studio) | ĐỔI | EN | Da Lat glows beyond the glass at night. Right for a weekend; right for a month. | Da Lat glows beyond the glass at night. A calm studio to settle into for a month, or longer. |
| | | VI | … Vừa vặn cho một cuối tuần, trọn vẹn cho một tháng. | Đêm xuống, Đà Lạt lên đèn ngay sau khung kính. Một studio yên tĩnh để ở trọn một tháng, hay lâu hơn. |
| | | KO | … 주말에도, 한 달에도 꼭 맞는 곳. | 밤이면 유리창 너머로 달랏이 빛납니다. 한 달, 혹은 그 이상 머물기 좋은 차분한 스튜디오. |
| | | ZH | … 住一个周末刚好，住一个月也正好。 | 入夜，大叻在窗外亮起灯火。一间安静的 Studio，住一个月或更久都正好。 |
| | | RU | … Подходит для выходных — и для целого месяца. | Ночью за стеклом светится Далат. Спокойная студия, чтобы прожить месяц или дольше. |
| `rooms.items[1].desc` (Garden Studio) | ĐỔI | EN | … Morning light for a short stay; a quiet desk for the weeks that follow. | Wake to green beyond the glass and a balcony of your own. Morning light, and a quiet desk for the weeks ahead. |
| | | VI | … Nắng sớm cho chuyến đi ngắn; góc làm việc yên tĩnh cho những tuần ở lại. | Thức dậy giữa sắc xanh sau khung kính, ban công là của riêng bạn. Nắng sớm, và góc làm việc yên tĩnh cho những tuần ở lại. |
| | | KO | … 짧게 머물 땐 아침 햇살을, 몇 주를 머물 땐 조용한 책상을. | 창밖의 초록과 나만의 발코니에서 맞는 아침. 아침 햇살, 그리고 앞으로의 몇 주를 위한 조용한 책상. |
| | | ZH | … 短住，有晨光相伴；长住，有安静的书桌。 | 醒来便是窗外的绿意，还有一方专属阳台。有晨光相伴，也有一张安静的书桌，陪您度过接下来的几周。 |
| | | RU | … Утренний свет — для короткой поездки, тихий рабочий стол — для недель, что последуют. | Просыпайтесь среди зелени за окном, с собственным балконом. Утренний свет и тихий рабочий стол — на недели вперёд. |
| `rooms.items[2].desc` (Premium) | ĐỔI (câu cuối; giữ giường phụ 1,4 m – test) | EN | … A suite for a short stay; room for family on a long one. | A separate bedroom and living room, a long navy kitchen and a [[1.4 m]] extra bed for one more. Space to share a long stay with family. |
| | | VI | … Như một suite khi ở ngắn; đủ chỗ đón người thân khi ở lâu. | Phòng ngủ, phòng khách tách riêng, gian bếp navy dài và giường phụ [[1,4 m]] cho thêm một người. Đủ chỗ để ở dài cùng người thân. |
| | | KO | … 짧게는 스위트처럼, 길게는 가족과 함께. | 독립된 침실과 거실, 길쭉한 네이비 주방, 한 사람을 더 위한 [[1.4m]] 보조 침대. 가족과 함께 길게 머물기에 충분한 공간. |
| | | ZH | … 短住如套房，长住可与家人同住。 | 独立卧室与客厅，狭长的藏青色厨房，另有一张 [[1.4 米]]加床，可多住一人。空间充裕，适合与家人长住。 |
| | | RU | … Как люкс — на короткий срок; простор для семьи — на долгий. | Отдельные спальня и гостиная, длинная тёмно-синяя кухня и дополнительная кровать [[1,4 м]] ещё для одного гостя. Достаточно места, чтобы надолго остановиться всей семьёй. |
| `rooms.items[3].desc` (Signature) | ĐỔI | EN | … One stay for the whole family, or for two who work remotely through a season. | Two bedrooms, a table for four and a balcony that holds the sunset. For a family settling in, or for two who work remotely through a season. |
| | | VI | … Một kỳ nghỉ cho cả gia đình, hoặc… | Hai phòng ngủ, bàn ăn bốn người và ban công đón hoàng hôn. Cho cả gia đình an cư, hoặc cho hai người làm việc từ xa suốt một mùa. |
| | | KO | … 온 가족의 여행으로도, 한 계절 원격 근무하는 두 사람을 위해서도. | 두 개의 침실, 4인용 식탁, 노을을 담는 발코니. 정착하는 가족에게도, 한 계절 원격 근무하는 두 사람에게도. |
| | | ZH | … 适合全家同游，也适合两人远程办公、旅居一季。 | 两间卧室，一张四人餐桌，一方盛满夕阳的阳台。适合全家安顿长住，也适合两人远程办公、旅居一季。 |
| | | RU | … Для всей семьи — или для двоих, кто работает удалённо целый сезон. | Две спальни, стол на четверых и балкон, где задерживается закат. Для семьи, которая обустраивается надолго, — или для двоих, кто работает удалённо целый сезон. |
| `rooms.note` | ĐỔI | EN | Room for one more guest on request. Rates by the night or by the month, prepared for your dates. | Stays from one month. Room for one more guest on request. |
| | | VI | … Giá theo đêm hoặc theo tháng, báo riêng theo ngày ở của bạn. | Kỳ ở từ một tháng. Có thể thêm một khách theo yêu cầu. |
| | | KO | … 요금은 1박 또는 월 단위로… | 1개월 이상 숙박. 요청 시 한 명 추가 가능. |
| | | ZH | … 按晚或按月计价，根据您的日期单独报价。 | 最短入住一个月。可应要求加住一人。 |
| | | RU | … Цены — за ночь или за месяц, под ваши даты. | Проживание от одного месяца. По запросу можно разместить ещё одного гостя. |

Quy tắc ghép trên thẻ phòng: dòng 1 `rooms.fromPrice(amount)` (cỡ chữ nội dung, Ink); dòng 2 `rooms.priceNote` (không nhỏ hơn chữ nội dung form – UXD chốt). Không có số → hiện `rooms.priceFallback`, ẩn `priceNote`. Không hiện "From" khi API lỗi.

## 3. Tiện nghi, vị trí, liên hệ (C)

| Khóa | TT | Ngôn ngữ | Cũ | Mới |
|---|---|---|---|---|
| `amenities.intro` | ĐỔI | EN | Small luxuries for one night. The essentials for a month. | Everything a month of living asks for, already in place. |
| | | VI | Ở một đêm, đó là sự chiều chuộng. Ở một tháng, đó là điều cần có. | Những gì một tháng sống cần, đã sẵn sàng. |
| | | KO | 하룻밤엔 작은 호사, 한 달엔 꼭 필요한 것. | 한 달의 생활에 필요한 것, 이미 갖춰져 있습니다. |
| | | ZH | 住一晚，是小小的享受；住一月，是必备的日常。 | 一个月的生活所需，均已备好。 |
| | | RU | На одну ночь — маленькая роскошь. На месяц — всё необходимое. | Всё, что нужно для жизни на месяц, уже на месте. |
| `amenities.groups[0..2]` | GIỮ | 5 ngôn ngữ | | (giữ) |
| `amenities.groups[3].body` | ĐỔI (giữ 3 mốc giờ site.json, gắn vào ngày dọn vào / ngày cuối) | EN | … and a smart lock for late arrivals. Check-in from 12:00 when your room is ready; it always is by 14:00. Check-out by 12:00. | A warm welcome at the ground-floor reception, [[07:00–22:00]], and a smart lock for coming home late. On move-in day, check-in from 12:00 when your room is ready; it always is by 14:00. On your last day, check-out by 12:00. |
| | | VI | … khóa điện tử để bạn đến muộn vẫn thong thả. Nhận phòng từ 12:00… Trả phòng trước 12:00. | Lễ tân đón bạn ở tầng trệt, [[07:00–22:00]]; khóa điện tử để bạn về muộn vẫn thong thả. Ngày dọn vào, nhận phòng từ 12:00 khi phòng đã sẵn sàng – và phòng luôn sẵn sàng lúc 14:00. Ngày cuối, trả phòng trước 12:00. |
| | | KO | … 늦은 도착을 위한 스마트 도어록… | 1층 리셉션에서 [[07:00–22:00]] 따뜻하게 맞이하며, 늦은 귀가를 위한 스마트 도어록이 있습니다. 입실일에는 객실이 준비되면 12:00부터 체크인할 수 있고, 14:00에는 항상 준비됩니다. 마지막 날 체크아웃은 12:00까지입니다. |
| | | ZH | … 深夜抵达也可用智能门锁入住。… | 一楼前台 [[07:00–22:00]] 热情迎候，深夜回来也可用智能门锁进出。入住当天，房间备好后 12:00 起即可入住，14:00 前一定备好。最后一天请于 12:00 前退房。 |
| | | RU | … а для поздних приездов есть электронный замок… | Ресепшн на первом этаже встречает гостей [[07:00–22:00]], а для поздних возвращений есть электронный замок. В день заезда — заселение с 12:00, если номер готов; к 14:00 он готов всегда. В последний день выезд до 12:00. |
| `location.intro`, bảng khoảng cách | GIỮ | 5 ngôn ngữ | | (giữ) |
| `location.ask` | ĐỔI | EN | Ask us about your dates | Ask about your move-in date |
| | | VI | Hỏi chúng tôi về ngày ở | Hỏi chúng tôi về ngày dọn vào |
| | | KO | 날짜 문의하기 | 입실 날짜 문의하기 |
| | | ZH | 咨询您的入住日期 | (giữ) |
| | | RU | Спросите нас о ваших датах | Спросите о дате заезда |
| `contact.intro` | ĐỔI | EN | Dates, rooms, a longer stay: message us on Zalo… | A move-in date, a room, how long you plan to stay: message us on Zalo and we will take care of the details. |
| | | VI | Ngày ở, phòng nghỉ, một kỳ ở dài: … | Ngày dọn vào, phòng nghỉ, bạn định ở bao lâu: nhắn chúng tôi qua Zalo, mọi chi tiết để chúng tôi lo. |
| | | KO | 날짜, 객실, 장기 숙박까지. … | 입실 날짜, 객실, 머무실 기간까지. Zalo로 메시지를 보내 주시면 세부 사항은 저희가 챙기겠습니다. |
| | | ZH | 日期、房型、长住安排：… | 入住日期、房型、计划住多久：通过 Zalo 给我们留言，细节交给我们。 |
| | | RU | Даты, номера, долгое проживание: … | Дата заезда, номер, срок проживания: напишите нам в Zalo, а детали мы возьмём на себя. |

## 4. CTA, thanh đáy (C)

| Khóa | TT | Ghi |
|---|---|---|
| `actions.requestToBook` | GIỮ | EN "Plan your stay", VI "Chọn ngày ở", KO "예약 문의", ZH "咨询预订", RU "Выбрать даты". Lý do: INV duyệt 24/10, có test + kiểm `dist-checks`, vừa thanh đáy 320–360 px (~16 ký tự). Hướng dài hạn đã nằm ở hero, thẻ phòng (giá tháng) và form. Phương án dài hơn ("Plan your long stay", 19 ký tự) không vừa thanh đáy điện thoại. |
| `actions.chatOnZalo`, `chatOnPrefix`, `chatOnSuffix`, `sticky.label` | GIỮ | Không nói về đêm/tháng. |
| `book.label` | GIỮ | Book direct / Đặt trực tiếp… |
| `book.title` | GIỮ | Plan your stay (khớp nút). |

## 5. Khối đặt phòng và form (C)

| Khóa | TT | Ngôn ngữ | Cũ | Mới |
|---|---|---|---|---|
| `book.intro` | ĐỔI | EN | Share your dates and how you like to travel. We will suggest the right room and prepare a rate for your stay. | Tell us your move-in date and how long you plan to stay. We will suggest the right room and send you a quote. |
| | | VI | Cho chúng tôi biết ngày bạn đến và cách bạn muốn ở… | Cho chúng tôi biết ngày bạn dọn vào và bạn định ở bao lâu. Chúng tôi sẽ gợi ý phòng phù hợp và gửi báo giá cho bạn. |
| | | KO | 날짜와 원하시는 여행 방식을 알려 주세요… | 입실 날짜와 머무실 기간을 알려 주세요. 잘 맞는 객실을 추천하고 견적을 보내 드립니다. |
| | | ZH | 告诉我们您的日期和出行方式… | 告诉我们您的入住日期和计划住多久，我们会为您推荐合适的房型，并发送报价。 |
| | | RU | Расскажите о датах и о том, как вы любите путешествовать… | Расскажите, когда хотите заехать и на сколько месяцев. Мы подберём подходящий номер и пришлём предложение. |
| `book.steps[0].title` | ĐỔI | EN | Share your dates | Share your plans |
| | | VI | Gửi ngày ở | Gửi kế hoạch ở |
| | | KO | 날짜 알려 주기 | 일정 알려 주기 |
| | | ZH | 告诉我们日期 | 告诉我们您的计划 |
| | | RU | Укажите даты | Расскажите о планах |
| `book.steps[0].text` | ĐỔI | EN | Dates, guests and the room you have in mind. | Move-in date, how many months, guests and the room you have in mind. |
| | | VI | Ngày ở, số khách và phòng bạn thích. | Ngày dọn vào, số tháng, số khách và phòng bạn thích. |
| | | KO | 날짜, 인원, 원하시는 객실. | 입실 날짜, 개월 수, 인원, 원하시는 객실. |
| | | ZH | 日期、人数和心仪的房型。 | 入住日期、月数、人数和心仪的房型。 |
| | | RU | Даты, число гостей и номер, который вам приглянулся. | Дата заезда, срок в месяцах, число гостей и номер, который вам приглянулся. |
| `book.steps[1]` | GIỮ | 5 ngôn ngữ | Trả lời qua Zalo trong 1 giờ… | (giữ – lời hứa BR-912 không đổi) |
| `book.steps[2].title` | ĐỔI | EN | Your room, held for you | Your room, confirmed |
| | | VI | Giữ phòng cho bạn | Xác nhận phòng cho bạn |
| | | KO | 객실 확보 | 객실 확정 |
| | | ZH | 为您保留房间 | 为您确认房间 |
| | | RU | Номер за вами | (giữ) |
| `book.steps[2].text` | ĐỔI (cọc 30% → cọc 1 tháng) | EN | When the quote feels right, a 30% deposit by QR transfer holds your room. | When the quote feels right, a one-month deposit by QR transfer confirms your room. |
| | | VI | Khi bạn ưng báo giá, OTTIMO giữ phòng cho bạn sau khi nhận cọc 30% qua [[mã QR]]. | Khi bạn ưng báo giá, OTTIMO xác nhận phòng sau khi nhận cọc một tháng qua [[mã QR]]. |
| | | KO | … 30% 예약금을 QR 송금으로… 객실을 확보해 드립니다. | 견적이 마음에 드시면, 1개월분 보증금을 QR 송금으로 보내 주시는 대로 객실을 확정해 드립니다. |
| | | ZH | … 扫码转账支付 30% 订金后，即为您保留房间。 | 如您对报价满意，扫码转账支付一个月押金后，即为您确认房间。 |
| | | RU | … предоплата 30% переводом по QR-коду закрепит номер за вами. | Когда предложение вас устроит, депозит за один месяц переводом по QR-коду закрепит номер за вами. |
| `book.reassure` | GIỮ | 5 ngôn ngữ | | (giữ) |
| `book.chat.title` | ĐỔI | EN | Send your dates on Zalo | Send your plans on Zalo |
| | | VI | Gửi ngày ở qua Zalo | Gửi kế hoạch ở qua Zalo |
| | | KO | Zalo로 날짜 보내기 | Zalo로 일정 보내기 |
| | | ZH | 通过 Zalo 发送日期 | 通过 Zalo 发送您的计划 |
| | | RU | Пришлите даты в Zalo | Пришлите планы в Zalo |
| `book.chat.text` | ĐỔI (giữ giờ + lời hứa) | EN | Message us your dates and the number of guests. We reply within 1 hour… | Message us your move-in date, how many months and the number of guests. We reply within 1 hour ([[07:00–22:00]]); outside these hours, before 09:00. |
| | | VI | Nhắn ngày ở và số khách qua Zalo… | Nhắn ngày dọn vào, số tháng và số khách qua Zalo. Chúng tôi trả lời trong 1 giờ ([[07:00–22:00]]); ngoài giờ, trước 09:00 sáng hôm sau. |
| | | KO | 날짜와 인원을 메시지로 보내 주세요… | 입실 날짜, 개월 수, 인원을 메시지로 보내 주세요. 1시간 이내([[07:00–22:00]])에 답변드리며, 그 외 시간에는 오전 09:00 전까지 답변드립니다. |
| | | ZH | 请发送您的日期和入住人数… | 请发送您的入住日期、月数和入住人数。我们会在 1 小时内回复（[[07:00–22:00]]）；其他时段，于 09:00 前回复。 |
| | | RU | Напишите нам даты и число гостей… | Напишите нам дату заезда, на сколько месяцев и число гостей. Ответим в течение 1 часа ([[07:00–22:00]]); в остальное время — до 09:00. |
| `book.form.title`, `yourStay` | GIỮ | 5 ngôn ngữ | | (giữ) |
| `book.form.lengthOfStay` | ĐỔI (nay là nhãn ô số tháng) | EN | Length of stay | Number of months |
| | | VI | Thời gian ở | Số tháng |
| | | KO | 숙박 기간 | 숙박 개월 수 |
| | | ZH | 入住时长 | 入住月数 |
| | | RU | Срок проживания | Сколько месяцев |
| `book.form.monthsHint` | NEW (dưới ô số tháng) | EN | — | Stays start at one month. |
| | | VI | — | Kỳ ở tối thiểu một tháng. |
| | | KO | — | 최소 1개월부터 머무실 수 있습니다. |
| | | ZH | — | 最短入住一个月。 |
| | | RU | — | Минимальный срок — один месяц. |
| `book.form.byNight` | REMOVE | 5 ngôn ngữ | By the night / Theo đêm / 1박 단위 / 按晚 / Несколько ночей | — |
| `book.form.byMonth` | REMOVE | 5 ngôn ngữ | By the month / Theo tháng / 월 단위 / 按月 / Месяц и дольше | — |
| `book.form.checkIn` | REMOVE | 5 ngôn ngữ | Check-in / Nhận phòng / 체크인 / 入住 / Заезд | — |
| `book.form.checkOut` | REMOVE | 5 ngôn ngữ | Check-out / Trả phòng / 체크아웃 / 退房 / Выезд | — |
| `book.form.arrival` | ĐỔI (nhãn ngày dọn vào) | EN | Arrival | Move-in date |
| | | VI | Ngày đến | Ngày dọn vào |
| | | KO | 도착일 | 입실 날짜 |
| | | ZH | 抵达日期 | 入住日期 |
| | | RU | Дата заезда | (giữ) |
| `book.form.months[6]` (`value: ''`, "Not sure yet") | REMOVE | 5 ngôn ngữ | Not sure yet / Chưa chắc / 아직 미정 / 还不确定 / Пока не знаю | — (bắt buộc chọn số tháng, tối thiểu 1) |
| `book.form.months[0..5]` | GIỮ | 5 ngôn ngữ | 1, 2, 3, 6 tháng; 1 năm; 2 năm | (giữ nhãn; xem câu hỏi INV số 5 nếu muốn đủ 1–12 tháng) |
| `book.form.adults`, `ages6to11`, `under6`, `roomType`, `anyRoom` | GIỮ | 5 ngôn ngữ | | (giữ) |
| `book.form.noteHint` | ĐỔI (EN, VI, KO, ZH, RU: bỏ "giờ đến") | EN | Arrival time, a baby cot… Please no card or ID numbers. | Move-in time, a baby cot… Please no card or ID numbers. |
| | | VI | Giờ đến, cũi em bé… Vui lòng không ghi số thẻ, số giấy tờ. | Giờ dọn vào, cũi em bé… Vui lòng không ghi số thẻ, số giấy tờ. |
| | | KO | 도착 시간, 아기 침대 등. … | 입실 시간, 아기 침대 등. 카드 번호나 신분증 번호는 적지 말아 주세요. |
| | | ZH | 例如抵达时间、婴儿床…… | 例如入住时间、婴儿床……请勿填写银行卡号或证件号码。 |
| | | RU | Время приезда, детская кроватка… | (giữ) |
| `book.form.done.tonight` | ĐỔI | EN | Arriving tonight? Calling is fastest: | Moving in tonight? Calling is fastest: |
| | | VI | Bạn đến ngay tối nay? Gọi chúng tôi để được hỗ trợ nhanh nhất: | Bạn dọn vào ngay tối nay? Gọi chúng tôi để được hỗ trợ nhanh nhất: |
| | | KO | 오늘 밤 도착하시나요? 전화가 가장 빠릅니다: | 오늘 밤 입실하시나요? 전화가 가장 빠릅니다: |
| | | ZH | 今晚抵达？致电最快： | 今晚入住？致电最快： |
| | | RU | Приезжаете сегодня вечером? Быстрее всего позвонить: | Заезжаете сегодня вечером? Быстрее всего позвонить: |
| Các khóa form còn lại (`reachYou`, `yourName`, `replyOn`, `phone*`, `note`, `optional`, `noteLang`, `honeypot`, `consent`, `consentMore`, `privacy`, `submit`, `noJs`, `done.title/requestNumber/openZalo/again`) | GIỮ | 5 ngôn ngữ | | Câu pháp lý (`consent`, `consentMore`, `privacy`) giữ nguyên ý đã duyệt. |

Thứ tự ô form (đề xuất cho UXD/FE): Hạng phòng → Ngày dọn vào → Số tháng (+ `monthsHint`) → Người lớn / 6–11 / dưới 6 → hộp giá tháng → liên hệ.

## 6. FAQ (C)

Thứ tự mới: `[0]` Ở OTTIMO thế nào → `[1]` Dọn phòng → `[2]` `faq-long` (cách đặt) → `[3]` **NEW `faq-policy`** (Long-stay policy) → `[4]` `faq-real` (giữ).

| Khóa | TT | Ngôn ngữ | Cũ | Mới |
|---|---|---|---|---|
| `faq.items[0].q` | GIỮ | 5 ngôn ngữ | What is it like to stay at OTTIMO? … | (giữ) |
| `faq.items[0].a[0]` | ĐỔI (bỏ "dọn phòng mỗi ngày cho kỳ ngắn", bỏ giờ nhận/trả – giờ đã ở Tiện nghi) | EN | The attentiveness of a reception and, for short stays, daily housekeeping, … One night or several months, it simply works. | The attentiveness of a reception, with the ease of your own kitchen, washer-dryer and desk. A month or a season, it simply works. |
| | | VI | Sự chu đáo của lễ tân và, với kỳ ở ngắn, dọn phòng mỗi ngày; … | Sự chu đáo của lễ tân, cùng sự tiện lợi của gian bếp, máy giặt sấy và bàn làm việc riêng. Một tháng hay trọn một mùa, mọi thứ đều chu toàn. |
| | | KO | 리셉션의 세심한 응대와, 짧은 숙박이라면 매일의 하우스키핑. … | 리셉션의 세심한 응대에, 나만의 주방, 세탁건조기, 책상이 주는 편안함까지. 한 달이든 한 계절이든, 모든 것이 순조롭습니다. |
| | | ZH | 有前台的周到照应，短住每日清洁客房；… | 有前台的周到照应，也有专属厨房、洗烘一体机和书桌带来的便利。住一个月或一整季，一切都顺顺当当。 |
| | | RU | Внимание ресепшн и, при коротком проживании, ежедневная уборка — … | Внимание ресепшн — вместе с удобством собственной кухни, стирально-сушильной машины и рабочего стола. Месяц или целый сезон — всё просто работает. |
| `faq.items[1].q` | GIỮ | 5 ngôn ngữ | How often is my room made up? … | (giữ) |
| `faq.items[1].a[0]` | ĐỔI (bỏ vế ngắn ngày) | EN | Every day for short stays. On a monthly stay, you choose the rhythm that suits you. | On a long stay, you choose the cleaning rhythm that suits you. Tell us when you plan your stay. |
| | | VI | Mỗi ngày với kỳ ở ngắn. Ở theo tháng, bạn chọn lịch dọn phòng hợp với mình. | Ở dài ngày, bạn chọn lịch dọn phòng hợp với mình. Cho chúng tôi biết khi gửi yêu cầu. |
| | | KO | 짧은 숙박은 매일 청소해 드립니다. 월 단위 숙박은… | 장기 숙박은 원하시는 청소 주기를 직접 정하실 수 있습니다. 요청하실 때 알려 주세요. |
| | | ZH | 短住每日清洁。按月入住，可按您喜欢的频率安排。 | 长住期间，可按您喜欢的频率安排清洁。提交申请时告诉我们即可。 |
| | | RU | Каждый день — при коротком проживании. При проживании на месяц… | При долгом проживании вы сами выбираете удобный ритм уборки. Расскажите о нём в запросе. |
| `faq.items[2].q` (`faq-long`) | ĐỔI | EN | How do longer stays work? | How do I book a long stay? |
| | | VI | Ở dài ngày thế nào? | Đặt kỳ ở dài thế nào? |
| | | KO | 장기 숙박은 어떻게 진행되나요? | 장기 숙박은 어떻게 예약하나요? |
| | | ZH | 长住如何安排？ | 如何预订长住？ |
| | | RU | Как устроено долгое проживание? | Как забронировать долгое проживание? |
| `faq.items[2].a[0]` (`faq-long`) | ĐỔI (bỏ "Chọn Theo tháng"; trích nhãn `lengthOfStay` mới; bỏ "ở càng lâu càng ưu đãi" – xem câu hỏi INV số 4) | EN | Choose "By the month" in your request. We prepare a monthly rate for you, kinder the longer you stay, … | Choose your room, your move-in date and the "Number of months", then send your request. We reply with your quote, and your room is confirmed once your one-month deposit is received. Someone is always here when you need help. |
| | | VI | Chọn "Theo tháng" khi gửi yêu cầu. … ở càng lâu càng ưu đãi… | Chọn phòng, ngày dọn vào và "Số tháng", rồi gửi yêu cầu. Chúng tôi gửi báo giá; phòng được xác nhận khi chúng tôi nhận cọc một tháng. Và luôn có người hỗ trợ khi bạn cần. |
| | | KO | 요청하실 때 "월 단위"를 선택해 주세요. … | 객실, 입실 날짜, "숙박 개월 수"를 선택해 요청을 보내 주세요. 견적을 보내 드리며, 1개월분 보증금이 확인되면 객실이 확정됩니다. 도움이 필요하실 땐 언제든 곁에 사람이 있습니다. |
| | | ZH | 在申请中选择"按月"即可。… | 选择房型、入住日期和"入住月数"，然后提交申请。我们会发送报价；收到一个月押金后，房间即为您确认。需要帮助时，随时有人在。 |
| | | RU | Выберите в запросе «Месяц и дольше». … | Выберите номер, дату заезда и «Сколько месяцев», затем отправьте запрос. Мы пришлём предложение, а номер закрепим за вами после получения депозита за один месяц. И кто-то всегда рядом, если нужна помощь. |
| `faq.items[3]` `id: 'faq-policy'` – `q` | NEW | EN | — | What is the long-stay policy? |
| | | VI | — | Chính sách ở dài hạn thế nào? |
| | | KO | — | 장기 숙박 정책은 어떻게 되나요? |
| | | ZH | — | 长住政策是怎样的？ |
| | | RU | — | Каковы условия долгого проживания? |
| `faq-policy` `a[0]` – bàn giao | NEW | EN | — | Your room is handed over with all the basic furniture in place. Toiletries and other amenities are not included. |
| | | VI | — | Phòng được bàn giao đủ nội thất cơ bản. Không bao gồm đồ amenities như đồ dùng vệ sinh cá nhân. |
| | | KO | — | 기본 가구가 모두 갖춰진 상태로 객실을 인계해 드립니다. 세면도구 등 어메니티는 포함되지 않습니다. |
| | | ZH | — | 房间交付时配齐基本家具，不含洗漱用品等客房用品。 |
| | | RU | — | Номер передаётся со всей базовой мебелью. Туалетные принадлежности и другие расходные мелочи не входят. |
| `faq-policy` `a[1]` – tối thiểu + cọc | NEW | EN | — | The minimum stay is one month, with a deposit of one month's rate. |
| | | VI | — | Thời gian ở tối thiểu một tháng; tiền cọc bằng một tháng tiền phòng. |
| | | KO | — | 최소 숙박 기간은 1개월이며, 보증금은 1개월분 요금입니다. |
| | | ZH | — | 最短入住一个月，押金为一个月房费。 |
| | | RU | — | Минимальный срок — один месяц, депозит — стоимость одного месяца. |
| `faq-policy` `a[2]` – đơn giá điện nước | NEW | EN | — | Electricity is 4,000 VND per kWh and water 25,000 VND per m³, charged on what you actually use. |
| | | VI | — | Điện 4.000 VND/kWh, nước 25.000 VND/m³, tính theo số thực tế sử dụng. |
| | | KO | — | 전기 요금은 kWh당 4,000 VND, 수도 요금은 m³당 25,000 VND이며, 실제 사용량에 따라 청구됩니다. |
| | | ZH | — | 电费每千瓦时 4,000 VND，水费每立方米 25,000 VND，按实际用量计算。 |
| | | RU | — | Электричество — 4 000 VND за кВт·ч, вода — 25 000 VND за м³, по фактическому расходу. |
| `faq-policy` `a[3]` – chốt và hạn thanh toán | NEW | EN | — | We take the readings on the last day of each month. Please settle the bill before the 5th of the following month. |
| | | VI | — | Chỉ số điện nước chốt vào ngày cuối tháng; bạn thanh toán trước ngày 5 của tháng tiếp theo, theo số thực tế. |
| | | KO | — | 검침은 매월 말일에 하며, 다음 달 5일 전까지 실제 사용량에 따라 정산해 주세요. |
| | | ZH | — | 每月最后一天抄表，请于次月 5 日前按实际用量结清费用。 |
| | | RU | — | Показания снимаем в последний день месяца; оплатить счёт по фактическому расходу нужно до 5-го числа следующего месяца. |
| `faq.items[4]` (`faq-real`), `faq.depositAccount` | GIỮ | 5 ngôn ngữ | | (giữ – câu chống giả mạo SEC UXD-06; "booking platform's inbox" vẫn đúng vì khách ngắn ngày đi OTA) |
| `faq.label`, `faq.title` | GIỮ | 5 ngôn ngữ | | (giữ) |

Ghi chú: số trong `faq-policy` là tham số Desk (OWN chỉnh). Đề xuất FE đưa vào `site.json` (`longStay: { minMonths: 1, depositMonths: 1, electricityVndPerKwh: 4000, waterVndPerM3: 25000, billingDueDay: 5 }`) và test "số trên trang = site.json", như mục giờ nhận phòng hiện nay. Chữ "1 tháng / một tháng" giữ bằng chữ trong câu, không cần nội suy.

## 7. Chuỗi chạy của form (B)

| Khóa | TT | Ngôn ngữ | Cũ | Mới |
|---|---|---|---|---|
| `nights` | REMOVE (nếu FE không còn chỗ dùng sau khi bỏ theo đêm) | 5 ngôn ngữ | `n night(s)` / `n đêm` / `n박` / `n 晚` / ночь-ночи-ночей | — |
| `longHint` | REMOVE | 5 ngôn ngữ | `{n} nights. We will quote our long-stay rate.` … | — |
| `roomHint` | GIỮ | 5 ngôn ngữ | Sleeps 2–3. … 1.4 m extra bed … | (giữ – test giường phụ) |
| `when.callNow` | GIỮ | 5 ngôn ngữ | As you arrive tonight… | (giữ – nhánh máy chủ, vẫn đúng với ngày dọn vào hôm nay) |
| `e.inReq` | REMOVE | 5 ngôn ngữ | Choose your check-in date. … | — |
| `e.outReq` | REMOVE | 5 ngôn ngữ | Choose your check-out date. … | — |
| `e.order` | REMOVE | 5 ngôn ngữ | Check-out must be after check-in. … | — |
| `e.arrReq` | ĐỔI | EN | Choose your arrival date. | Choose your move-in date. |
| | | VI | Chọn ngày đến. | Chọn ngày dọn vào. |
| | | KO | 도착 날짜를 선택해 주세요. | 입실 날짜를 선택해 주세요. |
| | | ZH | 请选择抵达日期。 | 请选择入住日期。 |
| | | RU | Выберите дату заезда. | (giữ) |
| `e.monthsReq` | NEW | EN | — | Choose how many months you plan to stay. |
| | | VI | — | Chọn số tháng bạn định ở. |
| | | KO | — | 머무실 개월 수를 선택해 주세요. |
| | | ZH | — | 请选择入住月数。 |
| | | RU | — | Укажите, на сколько месяцев планируете остаться. |
| `e.range`, `e.cap`, `e.name`… `e.server`, `net.*`, `notReady`, `reload`, `sending`, `notSent`, `thanks`, `next.*`, `fallback`, `summary`, `chName` | GIỮ | 5 ngôn ngữ | | (giữ) |
| `estimate.label` | ĐỔI | EN | Estimated rate | Monthly rate |
| | | VI | Giá ước tính | Giá theo tháng |
| | | KO | 예상 요금 | 월 요금 |
| | | ZH | 预估价格 | 按月价格 |
| | | RU | Ориентировочная цена | Цена за месяц |
| `estimate.fromMonth` | NEW `(amount) => string` – dòng số chính, cùng chữ với `rooms.fromPrice` | EN | — | `From ${amount} / month` |
| | | VI | — | `Từ ${amount}/tháng` |
| | | KO | — | `월 ${amount}부터` |
| | | ZH | — | `每月 ${amount} 起` |
| | | RU | — | `От ${amount} в месяц` |
| `estimate.note` | NEW – ngay dưới số, cùng chữ với `rooms.priceNote` | 5 ngôn ngữ | — | (y như `rooms.priceNote` mục 2) |
| `estimate.final` | ĐỔI | EN | No room is held yet. Your quote confirms the final rate and availability. | No room is held yet. Your room is confirmed once your deposit is received. |
| | | VI | Chưa giữ phòng cho bạn. Giá chính thức và phòng trống được xác nhận trong báo giá. | Chưa giữ phòng cho bạn. Phòng được xác nhận khi chúng tôi nhận cọc. |
| | | KO | 객실은 아직 확보되지 않았습니다. 최종 요금과… | 객실은 아직 확보되지 않았습니다. 보증금이 확인되면 객실이 확정됩니다. |
| | | ZH | 尚未为您保留房间。最终价格及是否有房，以我们发送的报价为准。 | 尚未为您保留房间。收到押金后，房间即为您确认。 |
| | | RU | Это ещё не бронирование. Итоговую цену и наличие подтвердим в предложении. | Это ещё не бронирование. Номер закрепим за вами после получения депозита. |
| `estimate.prompt` | ĐỔI | EN | Choose a room and your dates to see an estimate. | Choose a room to see its monthly rate. |
| | | VI | Chọn hạng phòng và ngày ở để xem giá ước tính. | Chọn hạng phòng để xem giá theo tháng. |
| | | KO | 객실과 날짜를 선택하시면 예상 요금을… | 객실을 선택하시면 월 요금을 보여 드립니다. |
| | | ZH | 选择房型和日期，即可查看预估价格。 | 选择房型，即可查看按月价格。 |
| | | RU | Выберите номер и даты, чтобы увидеть ориентировочную цену. | Выберите номер, чтобы увидеть цену за месяц. |
| `estimate.anyRoom` | ĐỔI | EN | Choose a room to see an estimate, or let us suggest one in your quote. | Choose a room to see its monthly rate, or let us suggest one in your quote. |
| | | VI | Chọn một hạng phòng để xem giá ước tính, hoặc… | Chọn một hạng phòng để xem giá theo tháng, hoặc để chúng tôi gợi ý trong báo giá. |
| | | KO | 객실을 선택하시면 예상 요금을 볼 수 있습니다… | 객실을 선택하시면 월 요금을 볼 수 있습니다. 고르기 어려우시면 견적과 함께 추천해 드립니다. |
| | | ZH | 选择房型即可查看预估价格；… | 选择房型即可查看按月价格；也可由我们在报价中为您推荐。 |
| | | RU | Выберите номер, чтобы увидеть цену, или доверьте выбор нам… | Выберите номер, чтобы увидеть цену за месяц, или доверьте выбор нам — мы предложим вариант в ответе. |
| `estimate.loading` | GIỮ | 5 ngôn ngữ | Checking rates… | (giữ) |
| `estimate.unavailable` | ĐỔI | EN | No online estimate for these dates. We will include the rate in your quote. | No online rate for this room just now. We will include it in your quote. |
| | | VI | Chưa có giá ước tính trực tuyến cho ngày này… | Chưa có giá trực tuyến cho hạng phòng này. Chúng tôi sẽ gửi trong báo giá. |
| | | KO | 선택하신 날짜는 온라인 예상 요금이 없습니다… | 이 객실은 지금 온라인 요금이 없습니다. 견적에서 안내해 드리겠습니다. |
| | | ZH | 所选日期暂无在线预估价格… | 此房型暂无在线价格，我们会在报价中告知您。 |
| | | RU | Для этих дат онлайн-оценки нет… | Для этого номера сейчас нет онлайн-цены. Мы укажем её в предложении. |
| `estimate.error` | ĐỔI | EN | We could not load an estimate just now. Your quote will include the rate. | We could not load the rate just now. Your quote will include it. |
| | | VI | Chưa tải được giá ước tính… | Chưa tải được giá. Giá sẽ có trong báo giá chúng tôi gửi bạn. |
| | | KO | 지금은 예상 요금을 불러올 수 없습니다… | 지금은 요금을 불러올 수 없습니다. 견적에서 안내해 드리겠습니다. |
| | | ZH | 暂时无法获取预估价格，… | 暂时无法获取价格，具体价格请以报价为准。 |
| | | RU | Не удалось загрузить оценку. … | Не удалось загрузить цену. Мы укажем её в предложении. |
| `estimate.currency`, `taxIn`, `taxOut` | GIỮ | 5 ngôn ngữ | | (giữ – FE hiện `taxIn`/`taxOut` theo cờ API; xem câu hỏi INV số 1) |
| `estimate.sentWith` | ĐỔI | EN | This estimate is sent with your request. | This rate is sent with your request. |
| | | VI | Giá ước tính này được gửi kèm… | Giá này được gửi kèm yêu cầu của bạn. |
| | | KO | 이 예상 요금은 요청과 함께 전달됩니다. | 이 요금은 요청과 함께 전달됩니다. |
| | | ZH | 此预估价格将随申请一并发送。 | 此价格将随申请一并发送。 |
| | | RU | Эта оценка придёт к нам вместе с запросом. | Эта цена придёт к нам вместе с запросом. |
| `estimate.live` | ĐỔI chữ + chữ ký `(amount) => string` | EN | `Estimated rate updated: ${amount} for ${nights}` | `Monthly rate updated: from ${amount} a month` |
| | | VI | `Giá ước tính mới: ${amount} cho ${nights}` | `Giá theo tháng mới: từ ${amount}/tháng` |
| | | KO | `예상 요금이 변경되었습니다: ${nights} 기준 ${amount}` | `월 요금이 변경되었습니다: 월 ${amount}부터` |
| | | ZH | `预估价格已更新：${nights}，共 ${amount}` | `按月价格已更新：每月 ${amount} 起` |
| | | RU | `Ориентировочная цена обновлена: ${amount} за ${n}` | `Цена за месяц обновлена: от ${amount} в месяц` |
| `estimate.done` | ĐỔI (= `estimate.label` mới) | 5 ngôn ngữ | Estimated rate … | Monthly rate / Giá theo tháng / 월 요금 / 按月价格 / Цена за месяц |
| `estimate.liveCleared` | ĐỔI | EN | Estimated rate cleared. | Monthly rate cleared. |
| | | VI | Đã xóa giá ước tính. | Đã xóa giá theo tháng. |
| | | KO | 예상 요금이 지워졌습니다. | 월 요금이 지워졌습니다. |
| | | ZH | 预估价格已清除。 | 按月价格已清除。 |
| | | RU | Ориентировочная цена сброшена. | Цена за месяц сброшена. |
| `estimate.guests` | REMOVE | 5 ngôn ngữ | For n guests. … | — (giá "từ" theo hạng phòng, không theo số khách) |
| `estimate.total` | REMOVE | 5 ngôn ngữ | `${amount} for ${nights}` … | — |
| `estimate.perNight` | REMOVE | 5 ngôn ngữ | About {amount} a night … | — |
| `estimate.longStay` | REMOVE | 5 ngôn ngữ | Includes our longer-stay rate. … | — |
| `estimate.extraGuest` | REMOVE | 5 ngôn ngữ | Includes one more guest. … | — (khách thêm nằm trong báo giá, `roomHint` đã nói) |
| `estimate.minStay` | REMOVE | 5 ngôn ngữ | These dates have a minimum stay of n nights… | — (tối thiểu 1 tháng đã nằm ở `monthsHint`, ô số tháng không cho dưới 1) |
| `priceMonthlyOffer` (`label`, `text`, `live`) | REMOVE | 5 ngôn ngữ | A special offer for longer stays … (ESC-043) | — (thay bằng `estimate.fromMonth` + `estimate.note`; FB-INV-010 thay ESC-043) |

Quy tắc hộp giá trong form: chưa chọn phòng → `prompt`; "Gợi ý giúp tôi" → `anyRoom`; đang tải > 300 ms → `loading`; có số → `label` + `fromMonth(amount)` + `note` + `final` (+ `taxIn`/`taxOut`, `currency`) + `sentWith` dưới nút gửi; API không có số → `unavailable`; lỗi → `error`. Giá không phụ thuộc ngày dọn vào và số tháng trong Đợt 1.

## 8. Test đề xuất cho FE (sửa `copy.test.ts`)

1. Gỡ test ESC-043 `priceMonthlyOffer`; thay bằng: `estimate.fromMonth('X')` và `rooms.fromPrice('X')` chứa `X`, không chứa chữ số khác; `rooms.priceNote`, `estimate.note`, `estimate.final`, `monthsHint` không có chữ số, %, "!", từ cấm.
2. Test "quoted labels": `faq-long` chứa `book.form.lengthOfStay` (thay cho `byMonth`).
3. Test F5 giờ nhận/trả phòng: chỉ kiểm `amenities.groups[3].body` (FAQ[0] không còn giờ); đổi regex EN/VI theo câu mới ("On move-in day, check-in from 12:00 when your room is ready; it always is by 14:00. On your last day, check-out by 12:00." / "Ngày dọn vào, nhận phòng từ 12:00 khi phòng đã sẵn sàng – và phòng luôn sẵn sàng lúc 14:00. Ngày cuối, trả phòng trước 12:00."). Vẫn cấm "Check-in from 14:00".
4. Test cọc: `book.steps[2].text` không còn `${depositPercent}%`; kiểm chứa cụm "one-month deposit" / "cọc một tháng" / "1개월분 보증금" / "一个月押金" / "депозит за один месяц". `site.json depositPercent` giữ cho Desk/OTA nếu còn dùng, không in trên landing.
5. Test mới `faq-policy`: có ở cả 5 ngôn ngữ; chứa đúng các số của `site.json.longStay` (4.000/4,000/4 000, 25.000/25,000/25 000, 5); không chứa "công tơ", "by meter", "phụ thu".
6. Mọi ngôn ngữ: không còn chuỗi theo đêm trên trang (`/night|đêm|박|晚|ноч/` không xuất hiện trong `texts(c)` trừ `photoAlt` – ảnh "dusk" không dính). Lưu ý ZH "晚餐" (bữa tối) trong `why.long.body` sẽ trúng `/晚/` – dùng `/\d\s*晚|按晚|一晚/` cho ZH; KO "밤" (đêm, cảnh) hợp lệ nên chỉ chặn `/\d박|1박/`.
7. Hình dạng: bỏ `months[].value === ''` khỏi ngoại lệ "no empty string".

## 9. Danh sách cho người bản xứ đọc lại (KO, ZH, RU)

Rủi ro cao nhất trước:
1. **KO `보증금` (tiền cọc dài hạn) vs `예약금`** ở `faq-real`/`depositAccount`: dùng hai từ khác nhau cho hai ngữ cảnh – nhờ người Hàn xác nhận không gây hiểu là hai khoản tiền.
2. **KO `입실` / `입실 날짜`** cho "ngày dọn vào": tránh `입주` (gợi thuê nhà/căn hộ). Cần xác nhận tự nhiên.
3. **RU `депозит`** (vs `залог`), và "оплатить … до 5-го числа" – có hiểu là "trước ngày 5" (không gồm ngày 5) không.
4. **ZH `抄表`, `押金`, `客房用品`** – đúng sắc thái nơi lưu trú, không gợi 公寓/月租.
5. RU `faq-policy a[2]` "кВт·ч", khoảng trắng nghìn "4 000" – kiểm hiển thị font.
6. ZH `rooms.fromPrice` "每月 {amount} 起" và KO "월 {amount}부터" – độ dài trên thẻ phòng 320 px.
7. Câu mới ở `why.short`, `hero.lead`, `rooms.items[*].desc` (cả 3 ngôn ngữ).

SEC/luật sư: không có câu pháp lý mới; câu cọc đổi từ 30% sang một tháng (`book.steps[2]`, `faq-long`, `faq-policy`, `estimate.final`) – SEC rút gọn xem để khớp quy trình VietQR (lễ tân gửi, không cổng online).

## 10. Tự kiểm

- [x] Không emoji, không "!", không IN HOA, giọng điềm tĩnh.
- [x] Không từ cấm (đã rà danh sách `BANNED`, gồm "thuê tháng", "lease", "công tơ", "by meter", "phụ thu", "căn", 公寓, квартир, 아파트); không nêu số phòng.
- [x] Chỉ dùng số INV đưa; giờ nhận/trả và lời hứa phản hồi giữ theo `site.json`.
- [x] Không còn chữ theo đêm/ngắn ngày trên trang và form (trừ `roomHint`, `callNow` – không nói đêm).
- [x] Câu pháp lý (`consent`, `consentMore`, `faq-real`) giữ nguyên.
- [x] RU: thêm ` ` trong "в месяц"; câu mới không dài hơn câu cũ ở nút/thanh đáy (nút không đổi).
- [x] Meta description ≤ 160 ký tự (EN 135, VI 131, KO 74, ZH 51, RU 140).

---
## Phụ lục – INV chốt 16/11 (qua ORC)
1. Giá tháng trên Desk **đã gồm VAT** → landing ghi "Taxes included".
2. Hạn thanh toán **hết ngày 5** → dùng "by the 5th" (VI: "chậm nhất ngày 5"), mọi ngôn ngữ.
3. Chăn ga, khăn **có trang bị theo số người ở**; không gồm đồ vệ sinh cá nhân và amenities khác. **Dọn phòng là dịch vụ cộng thêm**: Studio (City/Garden) 150.000 VND/lần, Premium và Signature 200.000 VND/lần – ghi rõ số trong FAQ dài hạn. Bỏ câu "khách chọn lịch dọn phòng" kiểu miễn phí.
4. **Không giảm giá theo thời hạn**: một giá tháng, bỏ câu "ở càng lâu càng ưu đãi".
5. Ô số tháng: giữ đề xuất CPY (1, 2, 3, 6 tháng, 1 năm, 2 năm).
6. Câu KO/ZH/RU: cần người bản xứ đọc trước production (INV lo, chưa chặn staging).
Các số (cọc 1 tháng, tối thiểu 1 tháng, điện 4.000/kWh, nước 25.000/m³, dọn phòng 150.000/200.000) đặt ở `site.json` để FE kiểm khớp.
