# Câu chữ landing ottimo.vn – LP-v2: tiếng Hàn, Trung giản thể, Nga + chữ giá ước tính

- Người viết: CPY | Round 4 – bước Sản xuất (lượt A, gói LP-v2) | Ngày: 01/11/2026
- Nguồn: FB-INV-008 (thêm ko/zh/ru), FB-INV-009 (giá ước tính trong form), `rounds/round-04/plan-lp-v2.md` (G1–G5).
- Bản dẫn: `product/apps/landing-web/src/content/en.ts` (CPY chốt 24/10, concept B). VI tham chiếu: `vi.ts`. Chuỗi chạy lúc gửi form: `src/scripts/booking-strings.ts`.
- **Không gồm:** trang thông báo xử lý dữ liệu (`privacy.ts`) – SEC làm. Các khóa trỏ tới trang đó (`book.form.privacy`, `footer.privacy`) phải **trùng tên trang** SEC chọn (mục 8).
- Quy trình: UXD kiểm khung (chữ Nga dài hơn EN 25–35%) → FE-B tạo `ko.ts`, `zh.ts`, `ru.ts` và mở rộng `BOOKING_STRINGS` → QA chạy test → **INV nhờ người bản xứ đọc lại** (G5, mục 9) → CPY đọc lại bản đã lên. CPY không sửa mã, không commit.

## Mục lục
1. Quy ước chung (giọng, xưng hô, tên riêng, số, đơn vị)
2. Chữ mới về giá ước tính – EN dẫn, VI, ko, zh, ru
3. Bản dịch `Copy` theo mục (ko | zh | ru)
4. `booking-strings.ts` (form: lỗi, trạng thái, thư cảm ơn)
5. Khóa mới và chỗ FE-B phải đổi cấu trúc
6. Danh sách từ cấm đề xuất cho ko/zh/ru
7. Test phải mở rộng
8. Phối hợp SEC / DOM / UXD
9. Điểm người bản xứ cần đọc kỹ
10. Câu hỏi cho INV và giả định
11. Tự kiểm của CPY

---

## 1. Quy ước chung

### 1.1 Giọng và xưng hô
| | ko | zh | ru |
|---|---|---|---|
| Mức lịch sự | 합니다/하세요 (kính ngữ trang trọng, mềm). Không dùng "당신" (nghe lạnh, kiểu dịch máy) – lược chủ ngữ hoặc dùng "나만의…" cho cảm giác riêng tư | Xưng khách **您**, xưng mình **我们**. Câu ngắn, không thành ngữ bốn chữ dày đặc (tránh giọng quảng cáo ồn) | Xưng khách **вы** viết thường (chuẩn web hiện đại; "Вы" hoa dùng cho thư cá nhân). Xưng mình **мы** |
| Bên mình | 저희 (khiêm), chỉ khi cần | 我们 | мы |
| Dấu câu | Dấu Latin. Không "!" | Dấu toàn khổ `，。：；（）“”`. Không "！" | Ngoặc «», gạch dài —. Không "!" |
| Ngắt dòng | UXD/FE: `word-break: keep-all` cho `lang="ko"` để không cắt giữa từ | `[[…]]` giữ cụm số + đơn vị | Gạch nối mềm tự động (`hyphens: auto`) nếu khung hẹp |

### 1.2 Tên riêng và thương hiệu
- **Giữ Latin:** OTTIMO, OTTIMO Boutique Stay (trong `meta.title`, footer), Zalo, WhatsApp, Telegram, Viber, Facebook, Google Maps (ko/zh viết "Google 지도", "Google 地图"), Dunlopillo, Hafele, Samsung, Electrolux, Premium, Signature (zh, ru).
- **H1 = tagline tiếng Anh** (`site.json`, "A refined stay inspired by the calm spirit of Dalat.") giữ nguyên trên mọi trang, đúng "tiếng Anh dẫn dắt". Câu `hero.lead` ngay dưới là bản địa.
- **"Boutique stay":** ko "부티크 스테이" (từ quen ở Hàn, "스테이" đang là từ thời thượng cho chỗ ở thiết kế); zh "精品住宿"; ru giữ Latin "boutique stay" vì "бутик-отель" chứa chữ "отель" (cấm) và "бутик-стей" chưa thành từ.
- **Tên hạng phòng** – theo mẫu VI: tên bản địa + `altName` tiếng Anh (`lang: 'en'`):

| slug | EN (giữ ở `altName`) | ko | zh | ru |
|---|---|---|---|---|
| standard-studio-city-view | City Studio | 시티 뷰 스튜디오 | 城景 Studio | Студия с видом на город |
| standard-studio-garden-view | Garden Studio | 가든 뷰 스튜디오 | 园景 Studio | Студия с видом на сад |
| premium-one-bedroom-1 | Premium One-Bedroom | 프리미엄 원베드룸 | Premium 一卧套房 | Premium с одной спальней |
| signature-two-bedrooms | Signature Two-Bedroom | 시그니처 투베드룸 | Signature 双卧套房 | Signature с двумя спальнями |

`shortName` (ô chọn phòng trong form): ko/zh = `name`; ru rút gọn: "Студия, вид на город" · "Студия, вид на сад" · "Premium, 1 спальня" · "Signature, 2 спальни".

- **Địa danh** (người bản xứ kiểm cách phiên âm – mục 9):

| EN | ko | zh | ru |
|---|---|---|---|
| Da Lat | 달랏 | 大叻 | Далат |
| Viet Nam | 베트남 | 越南 | Вьетнам |
| Bao Dai Summer Palace | 바오다이 여름 궁전 | 保大皇帝夏宫 | Летний дворец Бао Дая |
| Da Lat Cathedral | 달랏 대성당 | 大叻大教堂 | Кафедральный собор Далата |
| Da Lat Market · Xuan Huong Lake | 달랏 시장 · 쑤언흐엉 호수 | 大叻市场 · 春香湖 | Рынок Далата · озеро Суан Хыонг |
| Intercity bus station | 시외버스 터미널 | 长途汽车站 | Междугородний автовокзал |
| Tuyen Lam Lake | 뚜엔럼 호수 | 泉林湖 | Озеро Туен Лам |
| Lien Khuong Airport | 리엔크엉 공항 | 连姜机场 | Аэропорт Льенкхыонг |

- **Địa chỉ** (`site.json`) giữ tiếng Việt có dấu: khách đưa thẳng cho tài xế taxi/Grab. Không dịch.

### 1.3 Số, đơn vị, ngày giờ
| | ko | zh | ru |
|---|---|---|---|
| Thập phân | dấu chấm: 1.7km | dấu chấm: 1.7 公里 | **dấu phẩy**: 1,7 км (test giống VI) |
| Diện tích | 29 m² | 29 m² | 29 м² |
| Giờ | 07:00–22:00 (24 giờ) | 07:00–22:00 | 07:00–22:00 |
| Số đêm | `{n}박` | `{n} 晚` | 1 ночь · 2–4 ночи · 5+ ночей (hàm số nhiều, mục 4.2) |
| Ngày trong form (FE) | `ko-KR`: 2026년 11월 3일 (화) | `zh-CN`: 2026年11月3日 周二 | `ru-RU`: 3 ноября 2026 г., вт |
| Hotline trong câu | **+84 84 444 0909** (số quốc tế, khách gọi từ nước ngoài được) | như ko | như ko |

- `booking-logic.ts` đang định dạng ngày bằng `en-GB` – FE-B đổi sang locale của trang (ảnh hưởng `e.range(max)`, tóm tắt ngày).
- Hotline: trang EN/VI dùng `08.4444.0909`. Trang ko/zh/ru dùng số quốc tế từ `site.json` `phone.international` (FE-B lấy từ dữ liệu, không gõ cứng).

### 1.4 Bảng thuật ngữ (dùng thống nhất)
| Khái niệm | EN | ko | zh | ru |
|---|---|---|---|---|
| Phòng (hạng phòng) | room | 객실 | 客房 / 房型 | номер / тип номера |
| Yêu cầu đặt phòng | booking request | 예약 요청 | 预订申请 | запрос на бронирование |
| Báo giá | quote | 견적 | 报价 | предложение |
| Cọc | deposit | 예약금 | 订金 | предоплата |
| Ở ngắn / theo tháng | by the night / by the month | 1박 단위 / 월 단위 | 按晚 / 按月 | Несколько ночей / Месяц и дольше |
| Lễ tân | reception | 리셉션 | 前台 | ресепшн |
| Dọn phòng | housekeeping | 하우스키핑 | 客房清洁 | уборка |
| Giá ước tính | estimated rate | 예상 요금 | 预估价格 | ориентировочная цена |
| Thông báo xử lý dữ liệu | privacy notice | 개인정보 처리 안내 | 隐私声明 | Уведомление об обработке данных |

Ghi chú: ru **"предоплата"**, không "депозит" (ở Nga "депозит" thường hiểu là tiền đảm bảo hư hỏng, trả lại khi đi). zh **"订金"**, không "定金" (定金 mang nghĩa pháp lý phạt cọc theo luật TQ) – SEC/luật sư xác nhận (mục 8).

---

## 2. Chữ mới về giá ước tính (FB-INV-009)

Khung theo giả định ORC G1–G3: giá chỉ hiện **trong form**, sau khi khách chọn hạng phòng + ngày; hiện tổng cả chuyến; theo tháng hiện "từ … mỗi tháng"; thân trang không ghi giá. Con số, công thức, làm tròn, thuế: **DOM** (`rounds/round-04/outputs/DOM/web-price-estimate-rules.md`). CPY chỉ dùng chỗ giữ chỗ:
- `{amount}` – số tiền FE đã định dạng kèm đơn vị (đề xuất mục 2.3);
- `{nights}` – chuỗi số đêm đã chia số nhiều, lấy từ `BOOKING_STRINGS[lang].nights(n)` (ví dụ "3 nights", "3박", "3 晚", "3 ночи").

Đề xuất đặt: chữ tĩnh vào `book.form.estimate` (type `FormCopy`), chữ có `{…}` vào `BOOKING_STRINGS[lang].estimate` dưới dạng hàm. Tên khóa là đề xuất – ARC/FE-B có thể đổi, giữ chữ.

### 2.1 Bảng EN (dẫn) và VI

| Khóa | Khi nào hiện | EN | VI |
|---|---|---|---|
| `estimate.label` | Tiêu đề ô giá | Estimated rate | Giá ước tính |
| `estimate.final` | Luôn hiện dưới con số | Your final rate is in the quote we send. | Giá chính thức có trong báo giá chúng tôi gửi bạn. |
| `estimate.prompt` | Chưa chọn đủ hạng phòng + ngày | Choose a room and your dates to see an estimate. | Chọn hạng phòng và ngày ở để xem giá ước tính. |
| `estimate.anyRoom` | Khách chọn "Any room" | Choose a room to see an estimate, or let us suggest one in your quote. | Chọn một hạng phòng để xem giá ước tính, hoặc để chúng tôi gợi ý trong báo giá. |
| `estimate.loading` | Đang gọi API | Checking rates… | Đang tính giá… |
| `estimate.total` | Theo đêm – dòng chính | {amount} for {nights} | {amount} cho {nights} |
| `estimate.perNight` | Theo đêm – dòng phụ (trung bình, vì cuối tuần/lễ khác ngày thường) | About {amount} a night | Khoảng {amount} mỗi đêm |
| `estimate.longStay` | Có giảm theo thời gian ở (BR-107) | Includes our longer-stay rate. | Đã gồm ưu đãi ở dài ngày. |
| `estimate.monthly` | Theo tháng – dòng chính | From {amount} per month | Từ {amount} mỗi tháng |
| `estimate.monthlyNote` | Theo tháng – dòng phụ | The longer you stay, the kinder the rate. | Ở càng lâu, giá càng ưu đãi. |
| `estimate.unavailable` | Không có giá cho ngày đó | No online estimate for these dates. We will include the rate in your quote. | Chưa có giá ước tính trực tuyến cho ngày này. Chúng tôi sẽ báo giá riêng cho bạn. |
| `estimate.error` | API lỗi / quá tần suất | We could not load an estimate just now. Your quote will include the rate. | Chưa tải được giá ước tính. Giá sẽ có trong báo giá chúng tôi gửi bạn. |
| `estimate.overShortMax` | Theo đêm nhưng quá `shortMaxNights` (27) | For a month or longer, choose "By the month" to see a monthly rate. | Ở từ một tháng, chọn "Theo tháng" để xem giá theo tháng. |
| `estimate.currency` | Dưới con số (trang en/ko/zh/ru; VI có thể bỏ) | Rates in Vietnamese dong (VND). | Giá tính bằng VND. |
| `estimate.taxIn` *(phương án A – CPY đề xuất)* | Nếu DOM chốt giá đã gồm thuế | Taxes included. | Đã gồm thuế. |
| `estimate.taxOut` *(phương án B)* | Nếu DOM chốt chưa gồm thuế | Before taxes. | Chưa gồm thuế. |
| `estimate.extraGuest` *(tùy DOM)* | Số khách vượt chuẩn và DOM tính vào giá | Includes one more guest. | Đã gồm thêm một khách. |
| `estimate.sentWith` | Dưới nút gửi, khi có giá | This estimate is sent with your request. | Giá ước tính này được gửi kèm yêu cầu của bạn. |
| `estimate.live` | Vùng `aria-live` (chỉ trình đọc màn hình) | Estimated rate updated: {amount} for {nights} | Giá ước tính mới: {amount} cho {nights} |
| `done.estimate` | Thư cảm ơn, cạnh mã yêu cầu | Estimated rate | Giá ước tính |

Lý do lựa chữ:
- "rate", không "price" – cùng từ với `rooms.note`, `faq-long` ("a monthly rate", "prepared for your dates"). Không dùng "listed price"/"giá niêm yết": nghe như bảng giá cứng, trái với "báo giá riêng".
- `final` là câu INV yêu cầu, giữ sát: tạo kỳ vọng đúng mà không làm khách lo ("final" thay cho "may change").
- `perNight` là **trung bình**, không "n × giá": cuối tuần/lễ khác giá thì phép nhân sẽ sai. Nếu DOM chọn hiện chi tiết từng loại đêm, CPY viết thêm.
- `longStay` **không nêu số tiền giảm** (giữ giọng điềm tĩnh, không kiểu "tiết kiệm X"). Nếu INV muốn nêu: EN "Includes {amount} off for a longer stay." / VI "Đã gồm ưu đãi ở dài ngày: bớt {amount}." (ko/zh/ru viết khi chốt).
- Thuế: CPY đề xuất **A (đã gồm thuế)** – khách nước ngoài quen giá trọn gói, và giá hiện cho người tiêu dùng ở VN nên gồm thuế; DOM/SEC xác nhận.

### 2.2 Bản ko / zh / ru

| Khóa | ko | zh | ru |
|---|---|---|---|
| `estimate.label` | 예상 요금 | 预估价格 | Ориентировочная цена |
| `estimate.final` | 최종 요금은 보내 드리는 견적에서 확인하실 수 있습니다. | 最终价格以我们发送的报价为准。 | Окончательная цена — в предложении, которое мы пришлём. |
| `estimate.prompt` | 객실과 날짜를 선택하시면 예상 요금을 보여 드립니다. | 选择房型和日期，即可查看预估价格。 | Выберите номер и даты, чтобы увидеть ориентировочную цену. |
| `estimate.anyRoom` | 객실을 선택하시면 예상 요금을 볼 수 있습니다. 고르기 어려우시면 견적과 함께 추천해 드립니다. | 选择房型即可查看预估价格；也可由我们在报价中为您推荐。 | Выберите номер, чтобы увидеть цену, или доверьте выбор нам — мы предложим вариант в ответе. |
| `estimate.loading` | 요금 확인 중… | 正在计算价格… | Считаем цену… |
| `estimate.total` | {nights} 기준 {amount} | {nights}，共 {amount} | {amount} за {nights} |
| `estimate.perNight` | 1박 평균 약 {amount} | 平均每晚约 {amount} | В среднем около {amount} за ночь |
| `estimate.longStay` | 장기 숙박 요금이 적용되었습니다. | 已含长住优惠价。 | С учётом цены для долгого проживания. |
| `estimate.monthly` | 월 {amount}부터 | 每月 {amount} 起 | От {amount} в месяц |
| `estimate.monthlyNote` | 오래 머무실수록 요금이 더 좋아집니다. | 住得越久，价格越优惠。 | Чем дольше проживание, тем выгоднее цена. |
| `estimate.unavailable` | 선택하신 날짜는 온라인 예상 요금이 없습니다. 견적에서 요금을 안내해 드리겠습니다. | 所选日期暂无在线预估价格，我们会在报价中告知您。 | Для этих дат онлайн-оценки нет. Мы укажем цену в предложении. |
| `estimate.error` | 지금은 예상 요금을 불러올 수 없습니다. 견적에서 요금을 안내해 드리겠습니다. | 暂时无法获取预估价格，具体价格请以报价为准。 | Не удалось загрузить оценку. Цену мы укажем в предложении. |
| `estimate.overShortMax` | 한 달 이상 머무신다면 "월 단위"를 선택해 월 요금을 확인해 보세요. | 住一个月或以上，请选择“按月”查看月度价格。 | Если вы остаётесь на месяц или дольше, выберите «Месяц и дольше», чтобы увидеть цену за месяц. |
| `estimate.currency` | 요금은 베트남 동(VND) 기준입니다. | 价格以越南盾（VND）计。 | Цены во вьетнамских донгах (VND). |
| `estimate.taxIn` (A) | 세금 포함. | 含税。 | Налоги включены. |
| `estimate.taxOut` (B) | 세금 별도. | 不含税。 | Без учёта налогов. |
| `estimate.extraGuest` | 추가 인원 1명 포함. | 已含加住一人。 | С учётом ещё одного гостя. |
| `estimate.sentWith` | 이 예상 요금은 요청과 함께 전달됩니다. | 此预估价格将随申请一并发送。 | Эта оценка придёт к нам вместе с запросом. |
| `estimate.live` | 예상 요금이 변경되었습니다: {nights} 기준 {amount} | 预估价格已更新：{nights}，共 {amount} | Ориентировочная цена обновлена: {amount} за {nights} |
| `done.estimate` | 예상 요금 | 预估价格 | Ориентировочная цена |

Ghi chú ngữ pháp:
- ru `за {nights}`: "ночь" giống cách 4 và cách 1 → "за 1 ночь / за 3 ночи / за 7 ночей" đúng với chuỗi từ `nights(n)`.
- ko để `{nights}` **trước** số tiền ("3박 기준 …"), zh cũng vậy ("3 晚，共 …") – đúng trật tự tự nhiên.
- Tên nút trong `overShortMax` phải **trùng** `book.form.byMonth` của từng ngôn ngữ.

### 2.3 Đề xuất định dạng `{amount}` (FE-B, DOM duyệt)
- Số nguyên, nhóm nghìn theo locale + mã **VND** phía sau, không ký hiệu ₫ (khách nước ngoài ít quen, và ₫ có thể thiếu trong bộ font thay thế):
  - en/ko/zh: `1,250,000 VND` · vi: `1.250.000 VND` · ru: `1 250 000 VND` (khoảng trắng không ngắt).
- Không quy đổi sang KRW/CNY/RUB (tỉ giá đổi hằng ngày, dễ thành cam kết sai). Nếu INV muốn, làm ở báo giá.
- Không dùng "≈" (test chặn ký tự này) – đã thay bằng "About / 약 / 约 / около".

---

## 3. Bản dịch `Copy` theo mục (ko | zh | ru)

Đường dẫn khóa = `types.ts`. `[[…]]` giữ nguyên dấu không ngắt dòng. Khóa không có trong bảng: lấy giống EN (chỉ `honeypot` – mục 3.9).

### 3.1 Meta, bỏ qua, điều hướng, ngôn ngữ
| Khóa | ko | zh | ru |
|---|---|---|---|
| `lang` | `ko` | `zh` (hreflang/`<html lang>`: `zh-Hans` – mục 5) | `ru` |
| `meta.title` | OTTIMO Boutique Stay · 달랏 | OTTIMO Boutique Stay · 大叻 | OTTIMO Boutique Stay · Далат |
| `meta.ogImageAlt` | 해 질 녘의 OTTIMO, 발코니마다 따뜻한 불빛 | 黄昏时分的 OTTIMO，每个阳台都亮着暖光 | OTTIMO в сумерках, тёплый свет на каждом балконе |
| `skip` | 본문으로 건너뛰기 | 跳至正文 | Перейти к содержанию |
| `nav.label` | 주 메뉴 | 主导航 | Основное меню |
| `nav.mobileLabel` | 주 메뉴(모바일) | 主导航（移动端） | Основное меню (мобильное) |
| `nav.menu` | 메뉴 | 菜单 | Меню |
| `nav.why` | 스테이 | 住宿体验 | Пребывание |
| `nav.rooms` | 객실 | 客房 | Номера |
| `nav.amenities` | 편의시설 | 设施 | Удобства |
| `nav.location` | 위치 | 位置 | Расположение |
| `nav.faq` | 자주 묻는 질문 | 常见问题 | Вопросы |
| `nav.contact` | 문의 | 联系我们 | Контакты |
| `langSwitch.label` | 언어 | 语言 | Язык |
| `langSuggest.region` | 언어 | 语言 | Язык |
| `langSuggest.text` | 이 페이지를 한국어로 보기 | 以简体中文浏览本页 | Открыть страницу на русском |
| `langSuggest.close` | 닫기 | 关闭 | Закрыть |
| `LANG_NAME` (i18n.ts) | 한국어 | 简体中文 | Русский |
| `OG_LOCALE` (i18n.ts) | ko_KR | zh_CN | ru_RU |

`meta.description` (≤ 160 ký tự; CJK nên ngắn vì Google cắt theo độ rộng):
- ko: 달랏의 고요한 언덕 위, 잘 머무는 일에 집중한 부티크 스테이. 깊은 잠, 차분한 공간, 필요한 모든 것이 곁에. 하룻밤도, 한 계절도.
- zh: 大叻静谧山坡上的精品住宿，专注于“好好住”这件事：安稳的睡眠，宁静的空间，所需一应俱全。住一晚，或住一季。
- ru: Boutique stay на тихом склоне холма в Далате: глубокий сон, спокойные комнаты, всё под рукой. Останьтесь на ночь — или на целый сезон.

### 3.2 Nút hành động
| Khóa | ko | zh | ru |
|---|---|---|---|
| `actions.requestToBook` | 예약 문의 | 咨询预订 | Запланировать поездку |
| `actions.chatOnZalo` | Zalo로 문의 | 通过 Zalo 联系 | Написать в Zalo |
| `actions.chatOnPrefix` | *(xem mục 5.1 – cần hậu tố)* | *(xem mục 5.1)* | Написать в |
| `actions.newTab` | ` (새 탭에서 열림)` | `（在新标签页中打开）` | ` (откроется в новой вкладке)` |

- "Plan your stay" không dịch sát. ko "예약 문의" (hỏi đặt phòng) là nút quen thuộc nhất ở web lưu trú Hàn và đúng bản chất "yêu cầu", không phải đặt ngay. zh "咨询预订" tương tự. ru "Запланировать поездку" giữ tinh thần "lên kế hoạch"; phương án khác: "Оставить заявку" (rất phổ biến ở web Nga nhưng hơi thương mại).
- ru `chatOnPrefix` có dấu cách cuối: `'Написать в '`.

### 3.3 Ảnh (`photoAlt`)
| id | ko | zh | ru |
|---|---|---|---|
| hero-facade-dusk | 해 질 녘의 OTTIMO, 발코니마다 따뜻한 불빛 | 黄昏时分的 OTTIMO，每个阳台都亮着暖光 | OTTIMO в сумерках, тёплый свет на каждом балконе |
| signature-bed | 창가, 오크 단 위에 놓인 하얀 더블 침대 | 窗边橡木台上的洁白双人床 | Белая двуспальная кровать на дубовом подиуме у окна |
| detail-laundry-desk | 옷장과 업무용 책상 옆의 세탁기와 건조기 | 衣柜与书桌旁的洗衣机和烘干机 | Стиральная и сушильная машины рядом со шкафом и рабочим столом |
| city-living | 소파, TV 벽, 주방을 갖춘 크림·그레이 톤 스튜디오 | 米色与灰色调的开放式房间，配沙发、电视墙和厨房 | Студия в кремово-серых тонах с диваном, ТВ-стеной и кухней |
| garden-oak | 침대와 소파, 발코니 문이 있는 밝은 오크 톤 스튜디오 | 浅橡木色开放式房间，配床、沙发和通往阳台的门 | Студия в светлом дубе с кроватью, диваном и выходом на балкон |
| premium-kitchen | 거실과 발코니로 이어지는 길쭉한 네이비 주방 | 狭长的藏青色厨房，连通客厅与阳台 | Длинная тёмно-синяя кухня, переходящая в гостиную и балкон |
| signature-dining | 4인용 식탁이 있는 거실·주방·다이닝 오픈 공간 | 开放式客厅、厨房与餐区，配四人餐桌 | Открытое пространство: гостиная, кухня и столовая со столом на четверых |
| detail-kitchen | 인덕션, 대형 냉장고, 세탁건조기를 갖춘 오크 주방 | 橡木厨房，配电磁炉、全尺寸冰箱和洗烘一体机 | Дубовая кухня с индукционной плитой, большим холодильником и стирально-сушильной машиной |
| aerial-hillside | 고요한 언덕 위의 OTTIMO를 위에서 내려다본 모습, 뒤로 달랏 시내와 산 | 俯瞰 OTTIMO：静谧山坡之上，身后是大叻城区与群山 | OTTIMO сверху: тихий склон холма, позади Далат и горы |
| lobby | 오크 리셉션 데스크가 있는 1층 로비 | 一楼大堂与橡木前台 | Лобби на первом этаже с дубовой стойкой ресепшн |
| city-bed | 커튼이 드리운 창가의 더블 침대 | 挂着窗帘的窗边双人床 | Двуспальная кровать у окна со шторами |
| city-view | 도시가 내려다보이는 통창 옆 소파 | 落地窗旁的沙发，可俯瞰城市 | Диван у панорамных окон с видом на город |
| garden-navy | 침대와 소파, 발코니로 난 유리문이 있는 네이비 톤 스튜디오 | 藏青色调开放式房间，配床、沙发和通往阳台的玻璃门 | Студия в тёмно-синих тонах с кроватью, диваном и стеклянной дверью на балкон |
| garden-balcony | 해 질 녘 초록 언덕이 내려다보이는 전용 발코니 | 日落时分的私人阳台，俯瞰青翠山坡 | Собственный балкон с видом на зелёные склоны на закате |
| detail-balcony-sunset | 달랏 언덕 너머로 해가 지는 발코니 | 日落时的阳台，远眺大叻群山 | Балкон на закате над холмами Далата |
| premium-bed | 더블 침대와 창가 책상이 있는 독립 침실 | 独立卧室，配双人床和窗边书桌 | Отдельная спальня с двуспальной кроватью и столом у окна |
| premium-living | 발코니 옆에 소파가 놓인 거실 | 客厅，沙发紧邻阳台 | Гостиная с диваном у балкона |
| signature-bath | 유리 샤워 부스와 초록 타일 세면대 | 玻璃淋浴间与绿色瓷砖洗手台 | Душевая со стеклянной перегородкой и раковина в зелёной плитке |
| signature-bedroom-desk | 책상, 붙박이장, 단 위 침대가 있는 침실. 복도 너머로 세탁기와 건조기 | 卧室配书桌、嵌入式衣柜和抬高的床，走廊另一侧是洗衣机和烘干机 | Спальня с письменным столом, встроенным шкафом и кроватью на подиуме; в коридоре — стиральная и сушильная машины |
| garden-navy-kitchen | 소파 코너 옆 네이비·오크 주방, 달랏이 내다보이는 높은 창 | 藏青与橡木色厨房紧邻沙发角，高窗外是大叻 | Кухня в тёмно-синем и дубе рядом с диваном, высокие окна с видом на Далат |
| signature-living-oak | 오크 선반 벽, TV, 크림색 소파, 대형 냉장고가 있는 거실 | 客厅配橡木置物墙、电视、米色沙发和全尺寸冰箱 | Гостиная со стеллажом из дуба, телевизором, кремовым диваном и большим холодильником |
| signature-laundry-dining | 식탁과 오크 주방 옆의 세탁기와 건조기 | 餐桌与橡木厨房旁的洗衣机和烘干机 | Стиральная и сушильная машины рядом с обеденным столом и дубовой кухней |
| city-studio | 크림색 소파 뒤로 침대가, 유리 블록 벽 옆으로 책상이 놓인 스튜디오 | 开放式房间：米色沙发，后方是床，玻璃砖隔断旁有书桌 | Студия: кремовый диван, за ним кровать, у стены из стеклоблоков рабочий стол |
| city-kitchen | 대형 냉장고와 하얀 식사용 카운터가 있는 그레이 주방 | 灰色厨房，配全尺寸冰箱和白色吧台 | Серая кухня с большим холодильником и белой барной стойкой |
| city-laundry | 샤워실 옆 공간에 놓인 세탁기와 건조기 | 淋浴间旁壁龛里的洗衣机和烘干机 | Стиральная и сушильная машины в нише рядом с душевой |
| premium-living-tv | TV 벽이 있는 거실, 복도 끝의 세탁기와 건조기 | 带电视墙的客厅，走廊尽头是洗衣机和烘干机 | Гостиная с ТВ-стеной; в конце коридора стиральная и сушильная машины |
| premium-extra-bed | 보조 침대, TV, 발코니 문 옆 소파가 있는 거실 | 客厅配加床、电视和阳台门边的沙发 | Гостиная с дополнительной кроватью, телевизором и диваном у балконной двери |
| premium-bath | 유리 샤워 부스와 초록 타일 세면대 벽이 있는 욕실 | 浴室配玻璃淋浴间和绿色瓷砖洗手台墙 | Ванная со стеклянной душевой и стеной из зелёной плитки у раковины |

Tầng: "ground floor" = ko **1층**, zh **一楼**, ru **первый этаж** (cả ba nước đếm tầng trệt là tầng 1). Không dịch "tầng trệt" sát chữ.

### 3.4 Hero, trình chiếu, thư viện ảnh
| Khóa | ko | zh | ru |
|---|---|---|---|
| `hero.label` | 부티크 스테이 · 달랏 | 精品住宿 · 大叻 | Boutique stay · Далат |
| `hero.lead` | 달랏 언덕 위, 고요하고 정갈한 객실. 잠은 쉬이 들고, 모든 것은 막힘없이 흘러갑니다. | 大叻山坡上，安静而用心的客房。在这里，入眠不难，一切自然顺畅。 | Тихие, продуманные до мелочей номера на склоне холма в Далате: здесь легко засыпается, и всё просто работает. |
| `carousel.roledescription` | 슬라이드쇼 | 轮播图 | карусель |
| `carousel.label` | OTTIMO 사진 | OTTIMO 图片 | Фотографии OTTIMO |
| `carousel.track` | 사진, 방향키로 넘겨 보세요 | 图片，可用方向键切换 | Фотографии, листайте клавишами со стрелками |
| `carousel.slideRole` | 슬라이드 | 幻灯片 | слайд |
| `carousel.slide(i, n)` | `${n}장 중 ${i}번째` | `第 ${i} 张，共 ${n} 张` | `${i} из ${n}` |
| `carousel.goTo(i, n)` | `${n}장 중 ${i}번째 사진 보기` | `查看第 ${i} 张图片，共 ${n} 张` | `Показать фото ${i} из ${n}` |
| `carousel.pause` | 슬라이드쇼 일시 정지 | 暂停轮播 | Остановить показ |
| `carousel.play` | 슬라이드쇼 재생 | 继续播放 | Продолжить показ |
| `gallery.open(n)` | `사진 ${n}장` | `${n} 张图片` | `${n} фото` |
| `gallery.dialogLabel(room)` | `${room} 사진` | `${room} 图片` | `Фотографии: ${room}` |
| `gallery.track` | 사진, 방향키로 넘겨 보세요 | 图片，可用方向键切换 | Фотографии, листайте клавишами со стрелками |
| `gallery.close` | 닫기 | 关闭 | Закрыть |
| `gallery.prev` | 이전 사진 | 上一张 | Предыдущее фото |
| `gallery.next` | 다음 사진 | 下一张 | Следующее фото |
| `gallery.counter(i, n)` | `${n}장 중 ${i}번째 사진` | `第 ${i} 张，共 ${n} 张` | `Фото ${i} из ${n}` |

ru "фото" không biến cách theo số – `gallery.open` không cần hàm số nhiều. `gallery.counter` được gọi với `i = "{i}"` (lightbox.ts thay sau): cả ba câu giữ `${i}` nguyên một chỗ, an toàn.

### 3.5 The Stay (`why`)
| Khóa | ko | zh | ru |
|---|---|---|---|
| `why.label` | 스테이 | 住宿体验 | Пребывание |
| `why.title` | 잘 머무는 법. | 安住之道。 | Искусство хорошо жить. |
| `why.short.label` | 며칠 머문다면 | 小住几晚 | На несколько ночей |
| `why.short.title` | 하룻밤이라도, 여유롭게 | 即便一晚，也住得宽敞 | Простор даже на одну ночь |
| `why.long.label` | 한 달, 혹은 그 이상 | 住一个月，或更久 | На месяц или дольше |
| `why.long.title` | 달랏에서, 한 계절 살아 보기 | 旅居一季，从容生活 | Сезон, прожитый со вкусом |
| `why.more` | 객실 보기 | 查看客房 | Смотреть номера |

`why.intro`
- ko: 매일, 작은 것들을 제대로 하는 데서 시작됩니다. 빳빳한 침구, 흐트러지지 않는 고요, 따뜻한 오크 위의 빛. 하룻밤도, 한 계절도.
- zh: 一切始于每天把小事做好：挺括的床品，始终如一的安静，暖色橡木上的光。住一晚，或住一季。
- ru: Всё начинается с мелочей, сделанных правильно, каждый день: свежее бельё, ничем не нарушаемая тишина, свет на тёплом дубе. На одну ночь или на целый сезон.

`why.short.body`
- ko: 조용한 객실, 깊은 잠을 위한 침대, 매일의 하우스키핑. 그리고 뜻밖의 즐거움: 생각보다 넓은 공간과 나만의 발코니.
- zh: 安静的房间，为深睡而备的床，每日客房清洁。还有意外之喜：比您预想的更宽敞，还有一方专属阳台。
- ru: Тихий номер, кровать для глубокого сна, уборка каждый день. А затем сюрприз: больше пространства, чем вы ожидали, и собственный балкон.

`why.long.body`
- ko: 짐은 한 번만 풀고, 나만의 리듬을 찾으세요. 시장에서 시작하는 아침, 내 주방에서 차리는 저녁, 창가에서 보내는 조용한 업무 시간, 방 안에서 끝나는 빨래. 모든 것이 일상에 맞춰져 있습니다.
- zh: 行李只需打开一次，然后找到自己的节奏：清晨逛市场，晚餐在自己的厨房做，窗边安静工作几个小时，洗衣烘衣不出房门。一切都围绕您的生活方式。
- ru: Распакуйте чемодан один раз и найдите свой ритм: утро на рынке, ужин на собственной кухне, тихие часы работы у окна, стирка, не выходя из номера. Всё устроено под вашу жизнь.

Bản ngắn (nếu UXD thấy dài ở 360 px, giống ghi chú R3): bỏ câu cuối của `why.long.body` ở cả ba.

Ý văn hóa có chủ đích:
- ko "한 계절 살아 보기": người Hàn đang có trào lưu "한 달 살기" (sống thử một tháng ở nơi khác) – chạm đúng khách ở dài mà không nói "thuê".
- zh "旅居" (vừa du lịch vừa sống) là từ đang thịnh với khách Trung làm việc từ xa – đúng tệp digital nomad của brand.

### 3.6 Phòng (`rooms`)
| Khóa | ko | zh | ru |
|---|---|---|---|
| `rooms.label` | 객실 | 客房 | Номера |
| `rooms.title` | 마음에 드는 창을 고르세요 | 选一扇属于您的窗 | Выберите свой вид из окна |
| `rooms.intro` | 도시의 불빛, 혹은 정원의 초록. 둘을 위한 스튜디오부터 온 가족을 위한 투베드룸까지. | 城市灯火，或园中青绿。从两人小住的 Studio，到全家同住的双卧套房。 | Огни города или зелень сада. Студия для двоих или две спальни для всей семьи. |
| `rooms.request` | 이 객실 문의하기 | 咨询此房型 | Узнать об этом номере |
| `rooms.sleeps(min, max)` | `${min}–${max}인` | `可住 ${min}–${max} 人` | `Гостей: ${min}–${max}` |
| `items[].view` City | 시티 뷰 | 城景 | Вид на город |
| `items[].view` Garden (3 hạng còn lại) | 가든 뷰 | 园景 | Вид на сад |
| `items[].size` | giữ như EN (`29 m²`, `28–34 m²`, `37 m²`, `47 m²`) | giữ như EN | `29 м²`, `28–34 м²`, `37 м²`, `47 м²` |

ru `sleeps` viết "Гостей: 2–3" để tránh chia số nhiều theo khoảng (2–3 гостя / 4–5 гостей).

`rooms.items[].desc`
- City Studio
  - ko: 밤이면 유리창 너머로 달랏이 빛납니다. 주말에도, 한 달에도 꼭 맞는 곳.
  - zh: 入夜，大叻在窗外亮起灯火。住一个周末刚好，住一个月也正好。
  - ru: Ночью за стеклом светится Далат. Подходит для выходных — и для целого месяца.
- Garden Studio
  - ko: 창밖의 초록과 나만의 발코니에서 맞는 아침. 짧게 머물 땐 아침 햇살을, 몇 주를 머물 땐 조용한 책상을.
  - zh: 醒来便是窗外的绿意，还有一方专属阳台。短住，有晨光相伴；长住，有安静的书桌。
  - ru: Просыпайтесь среди зелени за окном, с собственным балконом. Утренний свет — для короткой поездки, тихий рабочий стол — для недель, что последуют.
- Premium One-Bedroom
  - ko: 독립된 침실과 거실, 길쭉한 네이비 주방, 한 사람을 더 위한 [[1.4m]] 보조 침대. 짧게는 스위트처럼, 길게는 가족과 함께.
  - zh: 独立卧室与客厅，狭长的藏青色厨房，另有一张 [[1.4 米]]加床，可多住一人。短住如套房，长住可与家人同住。
  - ru: Отдельные спальня и гостиная, длинная тёмно-синяя кухня и дополнительная кровать [[1,4 м]] ещё для одного гостя. Как люкс — на короткий срок; простор для семьи — на долгий.
- Signature Two-Bedroom
  - ko: 두 개의 침실, 4인용 식탁, 노을을 담는 발코니. 온 가족의 여행으로도, 한 계절 원격 근무하는 두 사람을 위해서도.
  - zh: 两间卧室，一张四人餐桌，一方盛满夕阳的阳台。适合全家同游，也适合两人远程办公、旅居一季。
  - ru: Две спальни, стол на четверых и балкон, где задерживается закат. Для всей семьи — или для двоих, кто работает удалённо целый сезон.

`rooms.note`
- ko: 요청 시 한 명 추가 가능. 요금은 1박 또는 월 단위로, 일정에 맞춰 안내해 드립니다.
- zh: 可应要求加住一人。按晚或按月计价，根据您的日期单独报价。
- ru: По запросу можно разместить ещё одного гостя. Цены — за ночь или за месяц, под ваши даты.

### 3.7 Tiện nghi (`amenities`)
| Khóa | ko | zh | ru |
|---|---|---|---|
| `amenities.label` | 편의시설 | 设施 | Удобства |
| `amenities.title` | 잘 머무는 일은, 디테일에서. | 安住，藏在每个细节里。 | Комфорт — в каждой детали. |
| `amenities.intro` | 하룻밤엔 작은 호사, 한 달엔 꼭 필요한 것. | 住一晚，是小小的享受；住一月，是必备的日常。 | На одну ночь — маленькая роскошь. На месяц — всё необходимое. |
| `groups[0].title` | 깊은 잠 | 睡得安稳 | Крепкий сон |
| `groups[1].title` | 편안한 일상 | 住得自在 | Быт без забот |
| `groups[2].title` | 집중하는 시간 | 专注工作 | Работа в тишине |
| `groups[3].title` | 자유로운 출입 | 来去自如 | Приезжайте, когда удобно |

`groups[0].body`
- ko: 깊은 잠을 위해 고른 Dunlopillo 매트리스와 고급 침구. 침대로 바람이 직접 닿지 않는 천장형 에어컨.
- zh: 为深睡挑选的 Dunlopillo 床垫与优质床品。吸顶式空调，风不直吹床铺。
- ru: Матрас Dunlopillo и качественное бельё, выбранные для глубокого сна. Потолочный кондиционер, который не дует на кровать.

`groups[1].body`
- ko: Hafele 인덕션, Samsung [[280L]] 냉장고, 전자레인지, 전기 주전자. 객실 안에 나만의 Electrolux 세탁기와 건조기.
- zh: Hafele 电磁炉、Samsung [[280 升]]冰箱、微波炉和电热水壶。房间内配有专属的 Electrolux 洗衣机和烘干机。
- ru: Индукционная плита Hafele, холодильник Samsung на [[280 л]], микроволновка и чайник. Собственные стиральная и сушильная машины Electrolux — прямо в номере.

`groups[2].body`
- ko: [[1Gbps]] 광인터넷, 창가의 책상, [[55인치]] 4K TV, 따뜻한 레인 샤워.
- zh: [[1 Gbps]] 光纤网络、窗边书桌、[[55 英寸]] 4K 电视和热水顶喷花洒。
- ru: Оптоволоконный интернет [[1 Гбит/с]], стол у окна, 4K-телевизор [[55 дюймов]] и тропический душ с горячей водой.

`groups[3].body` (giờ khớp `site.json`; không hứa phòng sẵn lúc 12:00 – luật BR-401 (e))
- ko: 1층 리셉션에서 [[07:00–22:00]] 따뜻하게 맞이하며, 늦은 도착을 위한 스마트 도어록이 있습니다. 객실이 준비되면 12:00부터 체크인할 수 있고, 14:00에는 항상 준비됩니다. 체크아웃은 12:00까지입니다.
- zh: 一楼前台 [[07:00–22:00]] 热情迎候，深夜抵达也可用智能门锁入住。房间备好后 12:00 起即可入住，14:00 前一定备好。退房时间为 12:00 前。
- ru: Ресепшн на первом этаже встречает гостей [[07:00–22:00]], а для поздних приездов есть электронный замок. Заселение с 12:00, если номер готов; к 14:00 он готов всегда. Выезд до 12:00.

### 3.8 Vị trí (`location`)
| Khóa | ko | zh | ru |
|---|---|---|---|
| `location.label` | 위치 | 位置 | Расположение |
| `location.title` | 고요한 언덕, 시내까지 몇 분. | 静谧山坡，距市区仅数分钟。 | Тихий склон в нескольких минутах от центра. |
| `location.intro` | 돌아오면 고요가 기다립니다. 시장, 카페, 쑤언흐엉 호수까지 차로 금방입니다. | 归来便是宁静。市场、咖啡馆和春香湖，车程都很近。 | Возвращайтесь в тишину. Рынок, кафе и озеро Суан Хыонг — в нескольких минутах езды. |
| `location.ask` | 날짜 문의하기 | 咨询您的入住日期 | Спросите нас о ваших датах |
| `location.maps` | Google 지도에서 열기 | 在 Google 地图中打开 | Открыть в Google Картах |
| `location.copy` | 주소 복사 | 复制地址 | Скопировать адрес |
| `location.copied` | 주소를 복사했습니다. | 地址已复制。 | Адрес скопирован. |
| `location.copyFailed` | 자동으로 복사하지 못했습니다. 주소를 길게 눌러 복사해 주세요. | 无法自动复制，请长按地址进行复制。 | Не удалось скопировать автоматически. Нажмите и удерживайте адрес, чтобы скопировать его. |
| `location.caption` | 차량 이동 시간 | 车程 | Время в пути на машине |
| `location.head` | 장소 · 거리 · 시간 | 地点 · 距离 · 时间 | Место · Расстояние · Время |
| `location.note` | Google 지도 기준, 차량 이동 예상 시간입니다. | 根据 Google 地图估算，驾车出行。 | Оценка Google Карт, на автомобиле. |

`location.head` là ba khóa `place`, `distance`, `time` theo thứ tự trên.

`location.rows` (giữ thứ tự, `[[…]]` như EN)
| # | ko (place · distance · time) | zh | ru |
|---|---|---|---|
| 1 | 바오다이 여름 궁전 · 1.7km · 4분 | 保大皇帝夏宫 · 1.7 公里 · 4 分钟 | Летний дворец Бао Дая · 1,7 км · 4 мин |
| 2 | 달랏 대성당 · 2.5km · 6분 | 大叻大教堂 · 2.5 公里 · 6 分钟 | Кафедральный собор Далата · 2,5 км · 6 мин |
| 3 | 달랏 시장 · [[쑤언흐엉 호수]] · 3.3km · 7분 | 大叻市场 · [[春香湖]] · 3.3 公里 · 7 分钟 | Рынок Далата · [[озеро Суан Хыонг]] · 3,3 км · 7 мин |
| 4 | 시외버스 터미널 · 3.7km · 8분 | 长途汽车站 · 3.7 公里 · 8 分钟 | Междугородний автовокзал · 3,7 км · 8 мин |
| 5 | 뚜엔럼 호수 · 4.1km · 9분 | 泉林湖 · 4.1 公里 · 9 分钟 | Озеро Туен Лам · 4,1 км · 9 мин |
| 6 | 리엔크엉 공항 · 약 28km · 30분 | 连姜机场 · 约 28 公里 · 30 分钟 | Аэропорт Льенкхыонг · около 28 км · 30 мин |

Lưu ý dòng 3: dấu "·" trong `place` là một phần của chuỗi `place` (giống EN "Da Lat Market · [[Xuan Huong Lake]]"); hai dấu "·" sau là tách cột trong bảng này.

### 3.9 Đặt phòng (`book`) – thân mục
| Khóa | ko | zh | ru |
|---|---|---|---|
| `book.label` | 직접 예약 | 官网直订 | Бронирование напрямую |
| `book.title` | 머무를 날을 계획해 보세요 | 规划您的入住 | Спланируйте поездку |
| `book.steps[0].title` | 날짜 알려 주기 | 告诉我们日期 | Укажите даты |
| `book.steps[0].text` | 날짜, 인원, 원하시는 객실. | 日期、人数和心仪的房型。 | Даты, число гостей и номер, который вам приглянулся. |
| `book.steps[1].title` | Zalo로 답변 | 我们通过 Zalo 回复 | Ответим в Zalo |
| `book.steps[2].title` | 객실 확보 | 为您保留房间 | Номер за вами |
| `book.chat.title` | Zalo로 날짜 보내기 | 通过 Zalo 发送日期 | Пришлите даты в Zalo |
| `book.chat.call` | 전화 | 致电 | Позвонить |

`book.intro`
- ko: 날짜와 원하시는 여행 방식을 알려 주세요. 잘 맞는 객실을 추천하고, 일정에 맞춘 요금을 준비해 드립니다.
- zh: 告诉我们您的日期和出行方式，我们会为您推荐合适的房型，并准备专属报价。
- ru: Расскажите о датах и о том, как вы любите путешествовать. Мы подберём подходящий номер и подготовим цену для вашей поездки.

`book.steps[1].text` (khớp `site.json`: 1 giờ, 07:00–22:00, 09:00)
- ko: 1시간 이내([[07:00–22:00]], 달랏 시간). 그 외 시간에는 다음 날 오전 09:00 전까지.
- zh: 1 小时内回复（[[07:00–22:00]]，大叻时间）；其他时段，次日 09:00 前回复。
- ru: В течение 1 часа ([[07:00–22:00]] по времени Далата); в остальное время — до 09:00 следующего утра.

`book.steps[2].text` (30% khớp `depositPercent`)
- ko: 견적이 마음에 드시면, 30% 예약금을 QR 송금으로 보내 주시는 대로 객실을 확보해 드립니다.
- zh: 如您对报价满意，扫码转账支付 30% 订金后，即为您保留房间。
- ru: Когда предложение вас устроит, предоплата 30% переводом по QR-коду закрепит номер за вами.

`book.reassure`
- ko: 이 페이지에서는 결제하지 않으며, 확정하시기 전까지 아무런 의무도 없습니다.
- zh: 无需在此付款；在您确认之前，不产生任何约束。
- ru: Здесь ничего не нужно оплачивать, и никаких обязательств, пока вы не скажете «да».

`book.chat.text`
- ko: 날짜와 인원을 메시지로 보내 주세요. 1시간 이내([[07:00–22:00]])에 답변드리며, 그 외 시간에는 오전 09:00 전까지 답변드립니다.
- zh: 请发送您的日期和入住人数。我们会在 1 小时内回复（[[07:00–22:00]]）；其他时段，于 09:00 前回复。
- ru: Напишите нам даты и число гостей. Ответим в течение 1 часа ([[07:00–22:00]]); в остальное время — до 09:00.

### 3.10 Form (`book.form`)
| Khóa | ko | zh | ru |
|---|---|---|---|
| `title` | 예약 요청 | 预订申请 | Запрос на бронирование |
| `yourStay` | 숙박 일정 | 入住信息 | Ваша поездка |
| `lengthOfStay` | 숙박 기간 | 入住时长 | Срок проживания |
| `byNight` | 1박 단위 | 按晚 | Несколько ночей |
| `byMonth` | 월 단위 | 按月 | Месяц и дольше |
| `checkIn` | 체크인 | 入住 | Заезд |
| `checkOut` | 체크아웃 | 退房 | Выезд |
| `arrival` | 도착일 | 抵达日期 | Дата заезда |
| `months` 1 / 2 / 3 / 6 | 1개월 / 2개월 / 3개월 / 6개월 | 1 个月 / 2 个月 / 3 个月 / 6 个月 | 1 месяц / 2 месяца / 3 месяца / 6 месяцев |
| `months` 12 / 24 / '' | 1년 / 2년 / 아직 미정 | 1 年 / 2 年 / 还不确定 | 1 год / 2 года / Пока не знаю |
| `adults` | 성인 | 成人 | Взрослые |
| `ages6to11` | 만 6–11세 | 6–11 岁儿童 | Дети 6–11 лет |
| `under6` | 만 6세 미만 | 6 岁以下 | До 6 лет |
| `roomType` | 객실 타입 | 房型 | Тип номера |
| `anyRoom` | 추천해 주세요 | 请为我推荐 | Любой, на ваш выбор |
| `reachYou` | 연락받을 방법 | 联系方式 | Как с вами связаться |
| `yourName` | 이름 | 您的姓名 | Ваше имя |
| `replyOn` | 답변 받을 채널 | 回复方式 | Куда ответить |
| `phoneCall` | 전화 | 电话 | Звонок |
| `phoneNumber` | 전화번호 | 电话号码 | Номер телефона |
| `phoneHint` | 베트남 외 번호는 국가 번호를 함께 입력해 주세요. 예: +82 | 如非越南号码，请加国家代码，例如 +86。 | Если номер не вьетнамский, укажите код страны, например +7. |
| `note` | 따로 전하실 말씀이 있나요? | 还有什么需要我们了解的吗？ | Что нам стоит знать? |
| `optional` | (선택) | （选填） | (необязательно) |
| `noteHint` | 도착 시간, 아기 침대 등. 카드 번호나 신분증 번호는 적지 말아 주세요. | 例如抵达时间、婴儿床……请勿填写银行卡号或证件号码。 | Время приезда, детская кроватка… Пожалуйста, не указывайте номера карт и документов. |
| `noteLang` **MỚI** | 한국어로 편하게 적어 주세요. 영어로 한 줄 덧붙여 주시면 더 빨리 답변드릴 수 있습니다. | 可用中文填写。如能附上一句英文，我们能更快回复您。 | Можно писать по-русски. Если добавите строку на английском, мы ответим быстрее. |
| `honeypot` | Leave this field empty (giữ EN như VI – trường ẩn cho bot) | như ko | như ko |
| `privacy` | 개인정보 처리 안내 | 隐私声明 | Уведомление об обработке данных |
| `submit` | 예약 요청 보내기 | 发送预订申请 | Отправить запрос |
| `noJs` | `요청 양식은 JavaScript가 필요합니다. Zalo로도 문의하실 수 있습니다: ` | `申请表需要启用 JavaScript。您也可以通过 Zalo 联系我们：` | `Для формы нужен JavaScript. Вы также можете написать нам в Zalo: ` |
| `done.title` | 요청이 전송되었습니다 | 申请已发送 | Запрос отправлен |
| `done.requestNumber` | 요청 번호 | 申请编号 | Номер запроса |
| `done.tonight` | `오늘 밤 도착하시나요? 전화가 가장 빠릅니다: ` | `今晚抵达？致电最快：` | `Приезжаете сегодня вечером? Быстрее всего позвонить: ` |
| `done.openZalo` | Zalo 열기 | 打开 Zalo | Открыть Zalo |
| `done.again` | 다른 요청 보내기 | 再发送一个申请 | Отправить ещё один запрос |

- `phoneHint` đổi ví dụ theo nước của người đọc (+82 / +86 / +7) thay cho +44 – khách thấy ngay số của mình.
- `noteLang` (MỚI): theo FB-INV-008 "Form ghi một câu mời khách viết thêm tiếng Anh nếu được". **Không hứa trả lời bằng tiếng Hàn/Trung/Nga** (mục 10, câu 3).
- ko "만 6–11세": ghi rõ tuổi quốc tế (người Hàn từng quen cách tính tuổi khác).

`consent` và `consentMore` – **câu pháp lý, giữ đúng ý bản đã duyệt; SEC/luật sư đối chiếu cùng bản dịch thông báo** (mục 8):
- `consent`
  - ko: OTTIMO가 이 양식의 정보를 이 요청에 답변하는 용도로만 사용하는 데 동의합니다.
  - zh: 我同意 OTTIMO 仅将本表单中的信息用于回复本次申请。
  - ru: Даю согласие на то, чтобы OTTIMO использовал данные из этой формы только для ответа на этот запрос.
- `consentMore`
  - ko: 예약하지 않으시면 이 정보는 180일 이내에 삭제됩니다. 답변은 이 페이지에 안내된 채널로만 드립니다.
  - zh: 如您未预订，我们将在 180 天内删除这些信息。我们只会通过本页面列出的渠道回复您。
  - ru: Если вы не забронируете, мы удалим эти данные в течение 180 дней. Мы отвечаем только через каналы, указанные на этой странице.

ru `consent` viết "Даю согласие…" để tránh "Я согласен(на)" (động từ chia theo giống).

### 3.11 Hỏi đáp (`faq`)
| Khóa | ko | zh | ru |
|---|---|---|---|
| `faq.label` | 자주 묻는 질문 | 常见问题 | Вопросы и ответы |
| `faq.title` | 알아 두면 좋은 것들 | 您可能想知道 | Полезно знать |
| `items[0].q` | OTTIMO에서의 숙박은 어떤가요? | 入住 OTTIMO 是怎样的体验？ | Каково это — жить в OTTIMO? |
| `items[1].q` | 객실 청소는 얼마나 자주 하나요? | 房间多久清洁一次？ | Как часто убирают номер? |
| `items[2].q` (`faq-long`) | 장기 숙박은 어떻게 진행되나요? | 长住如何安排？ | Как устроено долгое проживание? |
| `items[3].q` (`faq-real`) | OTTIMO에서 보낸 메시지인지 어떻게 확인하나요? | 如何确认消息确实来自 OTTIMO？ | Как убедиться, что сообщение действительно от OTTIMO? |

`items[0].a`
- ko: 리셉션의 세심한 응대와, 짧은 숙박이라면 매일의 하우스키핑. 여기에 나만의 주방, 세탁건조기, 책상이 주는 편안함까지. 객실이 준비되면 12:00부터 체크인할 수 있고, 14:00에는 항상 준비됩니다. 체크아웃은 12:00까지입니다. 하룻밤이든 몇 달이든, 모든 것이 순조롭습니다.
- zh: 有前台的周到照应，短住每日清洁客房；也有专属厨房、洗烘一体机和书桌带来的便利。房间备好后 12:00 起即可入住，14:00 前一定备好。退房时间为 12:00 前。住一晚或住几个月，一切都顺顺当当。
- ru: Внимание ресепшн и, при коротком проживании, ежедневная уборка — вместе с удобством собственной кухни, стирально-сушильной машины и рабочего стола. Заселение с 12:00, если номер готов; к 14:00 он готов всегда. Выезд до 12:00. Одна ночь или несколько месяцев — всё просто работает.

`items[1].a`
- ko: 짧은 숙박은 매일 청소해 드립니다. 월 단위 숙박은 원하시는 주기를 직접 정하실 수 있습니다.
- zh: 短住每日清洁。按月入住，可按您喜欢的频率安排。
- ru: Каждый день — при коротком проживании. При проживании на месяц вы сами выбираете удобный ритм.

`items[2].a` (nhãn trong ngoặc = đúng `book.form.byMonth` từng ngôn ngữ)
- ko: 요청하실 때 "월 단위"를 선택해 주세요. 오래 머무실수록 더 좋은 월 요금을 준비해 드리며, 모든 조건은 견적에 분명하게 적어 드립니다. 도움이 필요하실 땐 언제든 곁에 사람이 있습니다.
- zh: 在申请中选择“按月”即可。我们会为您准备按月价格，住得越久越优惠，所有条款都会在报价中写明。需要帮助时，随时有人在。
- ru: Выберите в запросе «Месяц и дольше». Мы подготовим цену за месяц — чем дольше проживание, тем она выгоднее, — а все условия чётко пропишем в предложении. И кто-то всегда рядом, если нужна помощь.

`items[3].a` (`deposit: true` – câu tài khoản `depositAccount` nối vào cuối đoạn 1; **SEC duyệt**)
- Đoạn 1
  - ko: 저희는 이 페이지에 안내된 채널, 또는 이용하신 예약 플랫폼의 메시지함으로만 연락드립니다. 카드 번호는 절대 묻지 않습니다.
  - zh: 我们只会通过本页面列出的渠道，或您所用预订平台的站内信与您联系。我们绝不会索要银行卡号。
  - ru: Мы связываемся с вами только через каналы, указанные на этой странице, или через сообщения платформы, на которой вы бронировали. Мы никогда не запрашиваем номера карт.
- Đoạn 2
  - ko: Facebook 페이지는 소식을 전하는 곳입니다. Facebook 메시지로는 예약을 확정하거나 예약금을 받지 않습니다.
  - zh: 我们的 Facebook 主页仅用于发布动态。我们不会通过 Facebook 消息确认预订或收取订金。
  - ru: Наша страница в Facebook — для новостей. Мы не подтверждаем бронирования и не принимаем предоплату через сообщения в Facebook.

`faq.depositAccount(holder)`
| | có `holder` | không có `holder` |
|---|---|---|
| ko | `예약금은 ${holder} 명의의 계좌로만 받으며, 메시지로 계좌 정보를 바꾸는 일은 절대 없습니다.` | `메시지로 계좌 정보를 바꾸는 일은 절대 없습니다.` |
| zh | `订金只汇入户名为 ${holder} 的账户；我们绝不会通过消息更改收款账户。` | `我们绝不会通过消息更改收款账户。` |
| ru | `Предоплата принимается только на счёт, оформленный на ${holder}, и мы никогда не меняем реквизиты в сообщениях.` | `Мы никогда не меняем реквизиты в сообщениях.` |

### 3.12 Liên hệ, chân trang, thanh nhanh, 404
| Khóa | ko | zh | ru |
|---|---|---|---|
| `contact.label` | 문의 | 联系我们 | Контакты |
| `contact.title` | 메시지 한 통이면 됩니다. | 只需一条消息。 | Достаточно одного сообщения. |
| `contact.intro` | 날짜, 객실, 장기 숙박까지. Zalo로 메시지를 보내 주시면 세부 사항은 저희가 챙기겠습니다. | 日期、房型、长住安排：通过 Zalo 给我们留言，细节交给我们。 | Даты, номера, долгое проживание: напишите нам в Zalo, а детали мы возьмём на себя. |
| `contact.facebookLink` | Facebook의 OTTIMO | OTTIMO 的 Facebook 主页 | OTTIMO в Facebook |
| `contact.mailSubject` | Booking – OTTIMO (한국어) | Booking – OTTIMO（中文） | Booking – OTTIMO (русский) |
| `contact.otherChannels` | 다른 채널 | 其他渠道 | Другие каналы |
| `contact.otherText` | WhatsApp · Telegram · Viber 번호: | WhatsApp、Telegram 和 Viber 号码： | WhatsApp, Telegram и Viber по номеру |
| `contact.privacy` | 채팅 앱과 Facebook은 누르실 때만 열립니다. 이 사이트는 추적 쿠키를 사용하지 않습니다. | 聊天应用和 Facebook 仅在您点击时打开。本网站不使用跟踪 Cookie。 | Мессенджеры и Facebook открываются, только когда вы на них нажимаете. Сайт не использует отслеживающие cookie. |
| `footer.backToTop` | ` – 맨 위로` | ` – 返回顶部` | ` – наверх` |
| `footer.links` | OTTIMO 링크 | OTTIMO 链接 | Ссылки OTTIMO |
| `footer.place` | 달랏 · 베트남 | 大叻 · 越南 | Далат · Вьетнам |
| `footer.privacy` | 개인정보 처리 안내 | 隐私声明 | Уведомление об обработке данных |
| `footer.operator` | 운영사 | 运营方 | Оператор |
| `footer.taxCode` | 세무 번호 | 税号 | Налоговый номер |
| `sticky.label` | 빠른 메뉴 | 快捷操作 | Быстрые действия |
| `notFound.title` | 페이지를 찾을 수 없습니다 · OTTIMO Boutique Stay | 页面未找到 · OTTIMO Boutique Stay | Страница не найдена · OTTIMO Boutique Stay |
| `notFound.heading` | 이 페이지를 찾을 수 없습니다. | 找不到这个页面。 | Не удалось найти эту страницу. |
| `notFound.body` | 링크가 오래되었거나 잘못 입력되었을 수 있습니다. OTTIMO에 관한 모든 내용은 홈페이지에 있습니다. | 链接可能已过期或输入有误。关于 OTTIMO 的一切，都在首页。 | Возможно, ссылка устарела или набрана с ошибкой. Всё об OTTIMO — на главной странице. |
| `notFound.back` | 홈페이지로 돌아가기 | 返回首页 | Вернуться на главную |

- `mailSubject`: giữ "Booking – OTTIMO" tiếng Anh + nhãn ngôn ngữ. Lý do: hộp thư do lễ tân VN đọc, nhìn tiêu đề là biết ngôn ngữ để mở công cụ dịch; khách vẫn thấy tên ngôn ngữ của mình.
- Tên pháp nhân và địa chỉ (`site.json` `legal`) giữ tiếng Việt.

---

## 4. `booking-strings.ts` – ko / zh / ru

### 4.1 Chuỗi tĩnh
| Khóa | ko | zh | ru |
|---|---|---|---|
| `chName.zalo / whatsapp` | Zalo / WhatsApp | Zalo / WhatsApp | Zalo / WhatsApp |
| `chName.phone` | 전화 | 电话 | телефона (cách 2 – chỉ dùng trong `e.phone`, xem 4.2) |
| `next.zalo` | 가장 빠른 답변을 원하시면 Zalo를 열어 이 번호를 보내 주세요. | 如需最快回复，请打开 Zalo，将此编号发给我们。 | Чтобы получить ответ быстрее, откройте Zalo и пришлите нам этот номер. |
| `next.whatsapp` | WhatsApp으로 메시지 드리겠습니다. | 我们将通过 WhatsApp 联系您。 | Мы напишем вам в WhatsApp. |
| `next.phone` | 전화드리겠습니다. | 我们将致电您。 | Мы вам позвоним. |
| `next.email` | 이메일로 답변드리겠습니다. | 我们将通过电子邮件回复您。 | Мы ответим по электронной почте. |
| `e.inReq` | 체크인 날짜를 선택해 주세요. | 请选择入住日期。 | Выберите дату заезда. |
| `e.outReq` | 체크아웃 날짜를 선택해 주세요. | 请选择退房日期。 | Выберите дату выезда. |
| `e.arrReq` | 도착 날짜를 선택해 주세요. | 请选择抵达日期。 | Выберите дату заезда. |
| `e.order` | 체크아웃 날짜는 체크인 날짜 이후여야 합니다. | 退房日期须晚于入住日期。 | Дата выезда должна быть позже даты заезда. |
| `e.name` | 이름을 알려 주세요. | 请填写您的姓名。 | Укажите ваше имя. |
| `e.email` | name@example.com 형식으로 이메일을 입력해 주세요. | 请输入有效的电子邮箱，例如 name@example.com。 | Укажите email в формате name@example.com. |
| `e.card` | 메모에서 카드 번호를 지워 주세요. | 请从备注中删除银行卡号。 | Пожалуйста, удалите номер карты из комментария. |
| `e.consent` | 답변을 드릴 수 있도록 동의란에 체크해 주세요. | 请勾选同意，以便我们回复您。 | Отметьте согласие, чтобы мы могли ответить. |
| `e.idNumber` | 이 단계에서는 신분증 번호가 필요하지 않습니다. 지워 주세요. | 此步骤无需提供证件号码，请将其删除。 | На этом этапе номер документа не нужен. Пожалуйста, удалите его. |
| `e.phoneCountry` | 번호를 확인해 주세요. 베트남 외 번호는 +와 국가 번호로 시작해야 합니다. | 请检查号码。非越南号码请以 + 和国家代码开头。 | Проверьте номер. Номера за пределами Вьетнама начинаются с + и кода страны. |
| `e.server` | 이 항목을 확인해 주세요. | 请检查此项。 | Проверьте это поле. |
| `net.network` | 요청을 보내지 못했습니다. 연결 상태를 확인한 뒤 다시 시도하시거나 Zalo로 문의해 주세요. | 申请未能发送。请检查网络后重试，或通过 Zalo 联系我们。 | Не удалось отправить запрос. Проверьте подключение и попробуйте ещё раз или напишите нам в Zalo. |
| `net.busy` | 지금 요청이 많습니다. Zalo로 문의하시거나 +84 84 444 0909로 전화해 주세요. | 目前申请较多。请通过 Zalo 联系我们，或致电 +84 84 444 0909。 | Сейчас у нас много запросов. Напишите нам в Zalo или позвоните по номеру +84 84 444 0909. |
| `net.rate` | 이 연결에서 요청이 너무 많이 전송되었습니다. 잠시 후 다시 시도하시거나 Zalo로 문의해 주세요. | 此网络发送的申请过多。请稍后再试，或通过 Zalo 联系我们。 | С этого подключения отправлено слишком много запросов. Попробуйте позже или напишите нам в Zalo. |
| `reload` | 페이지가 업데이트되었습니다. 새로고침한 뒤 요청을 다시 보내 주세요. | 页面已更新。请刷新页面后重新发送申请。 | Страница обновилась. Перезагрузите её и отправьте запрос ещё раз. |
| `sending` | 보내는 중… | 正在发送… | Отправляем… |
| `notSent` | 미리보기: 이 요청은 전송되지 않았습니다. Zalo로 문의해 주세요. | 预览：此申请未发送。请通过 Zalo 联系我们。 | Предпросмотр: запрос не отправлен. Напишите нам в Zalo. |

Mảng ghép (thứ tự giữ như EN; phần tử 2 và 4 là liên kết/giá trị do mã chèn):
- `fallback` = `[a, b, c]` → hiển thị `a{giờ}b{hotline}c`
  - ko: `['혹시 ', '까지 연락이 없으면 ', '로 전화하시거나, 요청 번호와 함께 Zalo로 메시지를 보내 주세요.']`
  - zh: `['如果到 ', ' 仍未收到我们的消息，请致电 ', '，或在 Zalo 上将此编号发给我们。']`
  - ru: `['Если до ', ' мы с вами не связались, позвоните по номеру ', ' или напишите в Zalo, указав этот номер.']`
- `notReady` = `[a, b, c]` → hiển thị `a[Zalo]b[hotline]c`
  - ko: `['지금은 온라인 요청을 잠시 받지 않고 있습니다. ', '로 메시지를 보내시거나 ', '로 전화해 주세요. 최대한 빨리 답변드리겠습니다.']`
  - zh: `['在线申请暂时关闭。请通过 ', ' 联系我们，或致电 ', '。我们会尽快回复。']`
  - ru: `['Онлайн-запросы сейчас временно не принимаются. Напишите нам в ', ' или позвоните по номеру ', '. Мы ответим как можно скорее.']`
- Hotline chèn vào hai mảng trên trên trang ko/zh/ru: dùng `phone.international` (mục 1.3).

### 4.2 Hàm (logic chữ, FE-B viết thành mã)
| Hàm | ko | zh | ru |
|---|---|---|---|
| `thanks(name)` | `${name}님, 감사합니다. 아직 예약 확정이 아닌 예약 요청입니다.` | `${name}，感谢您。这是预订申请，尚未确认预订。` | `Спасибо, ${name}. Это запрос, а не бронирование.` |
| `nights(n)` | `${n}박` | `${n} 晚` | `${n} ` + plural(n, 'ночь', 'ночи', 'ночей') |
| `summary(n)` | `${n}개 항목을 확인해 주세요` | `请检查 ${n} 项内容` | `Проверьте ${n} ` + plural(n, 'поле', 'поля', 'полей') |
| `longHint(n)` | `${n}박. 장기 숙박 요금으로 견적을 드립니다.` | `${n} 晚。我们将按长住价格为您报价。` | `${nights(n)}. Мы предложим цену для долгого проживания.` |
| `e.range(max)` | `오늘부터 ${max}까지의 날짜를 선택해 주세요.` | `请选择今天至 ${max} 之间的日期。` | `Выберите дату с сегодняшнего дня по ${max}.` |
| `e.cap(n)` | `이 객실은 최대 ${n}인까지 머물 수 있습니다(만 6세 미만 제외). 더 넓은 객실이나 "추천해 주세요"를 선택해 주세요.` | `此房型最多可住 ${n} 人（6 岁以下儿童不计）。请选择更大的房型，或选择“请为我推荐”。` | `В этом номере могут жить до ${n} гостей (дети до 6 лет не учитываются). Выберите номер побольше или «Любой, на ваш выбор».` |
| `e.phone(c)` | `연락 가능한 ${c} 번호를 입력해 주세요.` | `请输入可以联系到您的 ${c} 号码。` | `Укажите номер ${c}, по которому с вами можно связаться.` |
| `when.withinMinutes(m, open, close)` | `${dur} 이내에 답변드립니다(${open}–${close}, 달랏 시간).` · dur = m%60==0 ? `${m/60}시간` : `${m}분` | `我们将在 ${dur}内回复（${open}–${close}，大叻时间）。` · dur = m%60==0 ? `${m/60} 小时` : `${m} 分钟` | `Мы ответим в течение ${dur} (${open}–${close} по времени Далата).` · dur = m%60==0 ? `${h} ` + gen(h, 'часа', 'часов') : `${m} ` + gen(m, 'минуты', 'минут') |
| `when.nextMorning(by, open)` | `리셉션은 ${open}에 문을 엽니다. ${by} 전까지 답변드리겠습니다.` | `前台 ${open} 开始服务，我们会在 ${by} 前回复您。` | `Ресепшн открывается в ${open}. Мы ответим до ${by}.` |
| `when.callNow(m)` | `오늘 밤 도착하시니 ${m}분 이내에 연락드리겠습니다.` | `您今晚抵达，我们将在 ${m} 分钟内联系您。` | `Вы приезжаете сегодня вечером, поэтому мы свяжемся с вами в течение ${m} ` + gen(m, 'минуты', 'минут') + `.` |

`roomHint(lo, hi)`
- ko: có `lo` → `${lo}–${hi}인. 큰 숫자는 한 명이 더 머무는 경우(소파, 또는 프리미엄 원베드룸의 1.4m 보조 침대)이며, 견적에 포함됩니다.` · không → `인원에 맞는 객실을 추천해 드립니다.`
- zh: có `lo` → `可住 ${lo}–${hi} 人。较大的人数含加住一人（睡沙发，或 Premium 房型的 1.4 米加床），已含在报价中。` · không → `我们会根据人数为您推荐合适的房型。`
- ru: có `lo` → `Гостей: ${lo}–${hi}. Большее число — с ещё одним гостем (на диване или, в Premium, на дополнительной кровати 1,4 м); это учтено в предложении.` · không → `Мы подберём номер для вашей компании.`

Quy tắc số nhiều tiếng Nga (FE-B dùng `Intl.PluralRules('ru')` hoặc tự viết):
- `plural(n, one, few, many)`: n%10==1 và n%100!=11 → one; n%10 trong 2..4 và n%100 không trong 12..14 → few; còn lại → many. Ví dụ 1 ночь, 3 ночи, 5 ночей, 21 ночь, 12 ночей.
- `gen(n, sg, pl)` (sau "в течение"): n%10==1 và n%100!=11 → sg ("1 часа", "21 минуты"); còn lại → pl ("2 часов", "60 минут").

Với `roomHint` và `longHint`: nếu DOM chốt giá ước tính đã gồm khách thêm / giá ở dài, hai câu này vẫn đúng ("견적에 포함", "учтено в предложении"). Nếu DOM đổi (ví dụ khách thêm tính riêng), CPY sửa cùng lúc cả 5 ngôn ngữ.

---

## 5. Khóa mới và chỗ FE-B phải đổi cấu trúc

1. **`actions.chatOnPrefix` không hợp tiếng Hàn/Trung.** `StickyBar.astro` ghép `{chatOnPrefix}` + "Zalo" và ẩn tiền tố trên màn hình hẹp. Tiếng Hàn đặt trợ từ **sau** tên app ("Zalo로 문의"), tiếng Trung bọc hai đầu ("通过 Zalo 联系").
   - **Đề xuất:** thêm `chatOnSuffix?: string` (không bắt buộc; EN/VI/RU không điền). ko: prefix `''`, suffix `로 문의`; zh: prefix `通过 `, suffix ` 联系`. Ô hẹp chỉ còn "Zalo" như hiện nay.
   - Nếu không đổi type (test "không trường rỗng"): ko prefix `문의 · ` → "문의 · Zalo"; zh prefix `咨询 · ` → "咨询 · Zalo". Đọc được nhưng kém tự nhiên hơn.
2. **`book.form.noteLang` (MỚI):** đề xuất kiểu `noteLang?: string`, chỉ điền ở ko/zh/ru, hiện dưới `noteHint`. Nếu phải bắt buộc mọi ngôn ngữ: EN "You may write in your own language. A line in English helps us reply sooner." · VI "Bạn có thể viết bằng ngôn ngữ của mình." (CPY khuyên để tùy chọn, không hiện ở EN/VI).
3. **`book.form.estimate` + `BOOKING_STRINGS[lang].estimate` (MỚI):** mục 2. `{amount}`, `{nights}` → hàm.
4. **`BOOKING_STRINGS` mở rộng `Record<'en' | 'vi' | 'ko' | 'zh' | 'ru', …>`;** `booking-form.ts` dòng 33 đang chỉ nhận `'en' | 'vi'` – đổi theo `document.documentElement.lang`.
5. **Ngày theo locale:** `booking-logic.ts` (dòng 38, 48) đang cố định `en-GB` – dùng locale trang (`ko-KR`, `zh-CN`, `ru-RU`).
6. **Hotline quốc tế** trên trang ko/zh/ru (mục 1.3) – lấy `site.json` `phone.international`, kể cả liên kết trong `notReady`, `fallback`, `done.tonight`.
7. **`<html lang>` và hreflang tiếng Trung:** đề xuất `zh-Hans` (đường dẫn `/zh/`); ARC/FE-B chốt. `OG_LOCALE` mục 3.1.
8. **Neo trang privacy** trong `BookingForm.astro` dòng 27 (`yeu-cau-dat-phong` / `booking-requests`) – SEC đặt id cho ko/zh/ru.
9. **Font:** chuỗi ko/zh/ru dùng ký tự ngoài bộ latin/vietnamese – UXD chọn font thay thế (plan LP-v2). Không có ký tự lạ ngoài chữ bản địa, dấu câu toàn khổ (zh), «» và — (ru).

---

## 6. Danh sách từ cấm đề xuất cho ko / zh / ru (thêm vào `BANNED`)
Cùng tinh thần FB-INV-002 và INV 24/10: không "căn hộ", không chữ khách sạn, không số căn, không hạng sao, không "xác nhận ngay".

| Ý | ko | zh | ru |
|---|---|---|---|
| Căn hộ / dịch vụ | `/아파트/`, `/레지던스/`, `/서비스드/` | `/公寓/`, `/服务式/` | `/апартамент/iu`, `/квартир/iu`, `/посуточн/iu` |
| Khách sạn / nhà nghỉ | `/호텔/`, `/모텔/`, `/민박/`, `/홈스테이/`, `/게스트하우스/` | `/酒店/`, `/宾馆/`, `/旅馆/`, `/民宿/`, `/客栈/` | `/отел/iu`, `/гостиниц/iu`, `/хостел/iu`, `/гостев\S* дом/iu` |
| Hạng sao | `/\d\s*성급/` | `/\d\s*星级?/` (cẩn thận không chặn "星期") | `/\d\s*звезд/iu` |
| Xác nhận ngay | `/즉시 확정/` | `/立即确认/` | `/мгновенн\S* подтвержд/iu` |
| Số lượng phòng | `/(10|열)\s*(개\s*)?(객실|룸)/` | `/(10|十)\s*(间|套)/` | `/(10|десять)\s*(номер|комнат)/iu` |

CPY đã tự soát bản này với danh sách trên: không dính (mục 11). Lưu ý: zh dùng "套房" (suite) và "开放式房间" chỉ trong alt – không thuộc danh sách; "Номера" (ru) là từ chung cho phòng lưu trú, không phải "khách sạn".

---

## 7. Test phải mở rộng (`copy.test.ts`, `booking.test.ts`)
| Test hiện tại | Đổi cho ko/zh/ru |
|---|---|
| `it.each([en, vi])` (meta, emoji, "!", banned, cùng khóa) | Thêm `ko, zh, ru` vào mọi `it.each` |
| `numbers stated on the page = site.json` | `steps[1].text`, `chat.text` khớp 07:00–22:00, 09:00 và "1 giờ" theo ngôn ngữ: `/1시간/`, `/1 小时/`, `/1 часа/`; `steps[2].text` chứa `30%`; `amenities.groups[3].body` chứa 07:00–22:00, 12:00, 14:00 |
| `VI distances use a decimal comma` | RU cũng dấu phẩy; KO/ZH dấu chấm |
| `anti-impersonation answer` | Tìm cụm: ko `카드 번호는 절대 묻지 않습니다`, zh `绝不会索要银行卡号`, ru `никогда не запрашиваем номера карт` |
| `thank-you strings follow the 202 promise` | `withinMinutes(60, …)` ra `1시간` / `1 小时` / `1 часа` |
| `Premium has the 1.4 m extra bed` | `desc` Premium chứa `1.4m` (ko), `1.4 米` (zh), `1,4 м` (ru); `roomHint('2','3')` chứa cùng cụm |
| `every photo … alt text in both languages` | Mọi id có alt ở cả 5 ngôn ngữ |
| **Mới** | `faq-long` chứa đúng nhãn `book.form.byMonth`; `e.cap` chứa đúng `book.form.anyRoom`; `estimate.overShortMax` chứa đúng `byMonth` |
| **Mới** | ru `nights(1/3/5/21)` = `1 ночь / 3 ночи / 5 ночей / 21 ночь` |

---

## 8. Phối hợp
- **SEC:**
  - tên trang thông báo phải trùng `book.form.privacy` / `footer.privacy`: ko "개인정보 처리 안내", zh "隐私声明", ru "Уведомление об обработке данных". Nếu SEC chọn tên khác (ví dụ zh "个人信息处理说明"), CPY đổi theo SEC;
  - đối chiếu nghĩa `consent`, `consentMore`, `faq-real`, `depositAccount` với bản dịch thông báo – các câu này đụng pháp lý;
  - xác nhận zh "订金" (không "定金") và ru "предоплата" (không "депозит") cho tiền cọc – gửi kèm câu hỏi luật sư.
- **DOM:** thuế đã gồm hay chưa (chọn `taxIn`/`taxOut`), khách thêm có tính vào ước tính không (`extraGuest`, `roomHint`), giá trung bình mỗi đêm hay chi tiết từng loại đêm, có nêu số tiền giảm ở dài không.
- **UXD:** khung chữ Nga (nút "Запланировать поездку", nhãn "Ориентировочная цена", `why.long.body`) ở 360 px; `word-break: keep-all` cho ko; font thay thế.
- **ARC/FE-B:** mục 5.

---

## 9. Điểm người bản xứ cần đọc kỹ (INV chuyển cho người đọc)

Gửi kèm người đọc: brand là **boutique stay điềm tĩnh, cao cấp, tối giản**; không phải khách sạn, không phải căn hộ cho thuê; giọng ngắn, lịch sự, không cảm thán, không emoji. Nhờ họ sửa thẳng câu nào nghe như dịch máy.

### Tiếng Hàn (ko)
1. **Câu cốt lõi:** `why.title` "잘 머무는 법." (The art of staying well) và `amenities.title` "잘 머무는 일은, 디테일에서." – có sang và tự nhiên không? Phương án khác: "머묾의 미학".
2. **"부티크 스테이"** dùng cho "boutique stay" – có tự nhiên không, hay nên để Latin "Boutique Stay".
3. **Nút chính "예약 문의"** thay cho "Plan your stay" – có đủ mềm, không nghe như đặt ngay? Tiêu đề mục "머무를 날을 계획해 보세요" có gượng không.
4. **"달랏에서, 한 계절 살아 보기"** – ăn theo trào lưu "한 달 살기"; kiểm tra không nghe như quảng cáo nhà thuê.
5. **Tên hạng phòng bằng Hangul** (시티 뷰 스튜디오, 프리미엄 원베드룸…) hay để tiếng Anh.
6. **Phiên âm địa danh:** 쑤언흐엉 호수, 뚜엔럼 호수, 리엔크엉 공항, 바오다이 여름 궁전 – theo cách sách hướng dẫn/blog Hàn đang viết.
7. Mức kính ngữ toàn trang (합니다/해 주세요) có đều không; câu lỗi form có quá cứng không.
8. "하우스키핑" vs "객실 청소" – từ nào hợp khách Hàn hơn.

### Tiếng Trung giản thể (zh)
1. **"安住之道"** (why.title) và **"安住，藏在每个细节里"** – có đúng giọng tinh tế, không sáo?
2. **"精品住宿"** cho boutique stay; người đọc có thấy giống "精品酒店" (khách sạn) không.
3. **Tên hạng phòng trộn chữ:** "城景 Studio", "Premium 一卧套房" – hay đổi "城景开放式客房"? "套房" có làm khách hiểu là suite khách sạn không.
4. **"旅居一季"** – từ này có hợp khách đại lục, Đài Loan, Hồng Kông không (trang dùng giản thể, khách đại lục là chính).
5. **"订金"** cho tiền cọc (cần thêm ý kiến luật – mục 8).
6. **Địa danh:** 保大皇帝夏宫, 大叻大教堂 (dân gian gọi 鸡教堂), 春香湖, 泉林湖, 连姜机场 – kiểm cách gọi trên Ctrip/小红书.
7. "咨询预订" (nút chính) và "官网直订" (nhãn mục) – có tự nhiên không.
8. Dấu câu toàn khổ, khoảng cách giữa chữ Hán và chữ Latin/số (trang đang để một dấu cách) – theo thói quen nào người đọc thấy chuẩn.

### Tiếng Nga (ru)
1. **"Искусство хорошо жить."** cho "The art of staying well" – có thể nghe như "nghệ thuật sống sung túc". Phương án khác: "Искусство неспешного пребывания", "Искусство жить в покое". Nhờ người đọc chọn hoặc đề xuất.
2. **"boutique stay" để Latin** trong câu tiếng Nga – chấp nhận được không, hay có từ Nga tự nhiên mà **không** chứa "отель".
3. **"Номера"** (nav, mục phòng) – từ chuẩn cho phòng lưu trú nhưng gắn với khách sạn. Có nên dùng "Комнаты" / "Пространства"?
4. **Nút chính "Запланировать поездку"** – hay "Оставить заявку" / "Подобрать даты"?
5. **Hai lựa chọn thời gian ở** "Несколько ночей" / "Месяц и дольше" – CPY tránh "посуточно/помесячно" vì gợi thuê căn hộ. Có rõ nghĩa không.
6. **"предоплата"** thay "депозит"; "Как люкс — на короткий срок" (Premium) có gợi khách sạn quá không.
7. **Địa danh:** Суан Хыонг, Туен Лам, Льенкхыонг, Летний дворец Бао Дая – theo cách viết trên các trang du lịch Nga về Việt Nam.
8. Ngữ pháp số nhiều trong chuỗi động (ночь/ночи/ночей, поле/поля/полей, "в течение 1 часа") – người đọc thử vài con số.
9. Độ dài: bản Nga dài hơn ~30%; người đọc có thể đề xuất bản ngắn hơn cho nút và nhãn.

### Chung cho cả ba
- Câu pháp lý (`consent`, `consentMore`, `faq-real`, `depositAccount`): người bản xứ chỉ sửa giọng; **không đổi nghĩa** – nghĩa do SEC/luật sư chốt.
- Chữ giá ước tính (mục 2.2): đọc như một khách đang chọn ngày – có rõ "đây chỉ là ước tính" mà không làm mất tin tưởng không.

---

## 10. Câu hỏi cho INV và giả định

### Câu hỏi (gom cuối gói, kèm đề xuất)
1. **Kênh chat cho khách Hàn/Trung/Nga.** Khách Hàn quen KakaoTalk, khách Trung đại lục dùng WeChat và **không vào được** Google Maps, Facebook, WhatsApp, Telegram khi chưa có VPN; khách Nga quen Telegram/WhatsApp. Zalo lạ với cả ba nhóm.
   - **Đề xuất:** gói này giữ nguyên chữ "Zalo" làm kênh chính (không đổi phễu, không đổi mã). Form đã cho chọn WhatsApp/email/điện thoại nên khách vẫn gửi được. Nếu INV muốn mở KakaoTalk hoặc WeChat, đưa vào round sau (cần tài khoản doanh nghiệp, SEC rà).
2. **Tiền cọc của khách nước ngoài.** Bước 3 ghi "cọc 30% qua QR" – khách Hàn/Trung/Nga thường không có tài khoản ngân hàng VN; thẻ Nga không thanh toán quốc tế được.
   - **Đề xuất:** DOM ghi cách cọc thay thế cho khách nước ngoài (lễ tân gửi trong báo giá). Chữ trên trang giữ nguyên ý "30% qua QR" vì đã duyệt; sửa khi INV chốt cách mới.
3. **Ngôn ngữ trả lời.** Trang không hứa trả lời bằng tiếng Hàn/Trung/Nga; form mời khách thêm một dòng tiếng Anh (`noteLang`).
   - **Đề xuất:** lễ tân trả lời bằng tiếng Anh, kèm bản dịch máy ngôn ngữ của khách khi cần. Không ghi lời hứa này lên trang.
4. **Có nêu số tiền giảm khi ở dài trong ô giá?** **Đề xuất:** không – chỉ ghi "Includes our longer-stay rate." (điềm tĩnh, tránh giọng khuyến mãi).

### Giả định đã dùng
- G1–G5 của ORC trong `plan-lp-v2.md`. Giá chỉ trong form; thân trang không đổi chữ về giá.
- Nhãn "Estimated rate" / "Giá ước tính" thay cho "giá niêm yết ước tính" của INV: cùng ý, gọn hơn cho khách.
- Tiếng Trung = giản thể cho khách đại lục. Đường dẫn `/zh/`.
- Tên hạng phòng theo mẫu VI: tên bản địa + `altName` tiếng Anh. Premium/Signature giữ Latin ở zh/ru, Hangul ở ko.
- H1 = tagline tiếng Anh trên mọi trang.
- Giá trị DOM chưa có. Câu "đã gồm thuế" là phương án A, chờ DOM.

---

## 11. Tự kiểm của CPY
- Đủ mọi khóa của `Copy` trong `types.ts`, mọi khóa của `BookingStrings`, cộng khóa mới (`estimate.*`, `noteLang`, `chatOnSuffix`). `honeypot` giữ EN như VI.
- Không từ cấm hiện hành (`BANNED`) và đề xuất mục 6: không "apartment/căn/квартира/公寓/아파트", không chữ khách sạn ở mọi ngôn ngữ, không số lượng phòng, không hạng sao, không "!", emoji, mũi tên, "≈".
- Không nêu giá trong thân trang. Giá chỉ ở `estimate.*` (form) và chỉ là `{amount}`.
- Số liệu khớp `site.json`: 07:00–22:00, 1 giờ, 09:00, 30%, 12:00 / 14:00 / 12:00, 180 ngày, 280 L, 1 Gbps, 55 inch, 1,4 m. Không hứa phòng sẵn lúc 12:00.
- Không hứa điều không có: không bữa sáng, đưa đón, đỗ xe; không hứa trả lời bằng ngôn ngữ của khách.
- Nhãn trích dẫn khớp nhau trong từng ngôn ngữ: `faq-long` ↔ `byMonth`, `e.cap` ↔ `anyRoom`, `overShortMax` ↔ `byMonth`.
- `meta.title` ≤ 60 ký tự; `meta.description` ≤ 160 ký tự (ko ~75, zh ~55, ru ~140).
- Giới hạn: CPY viết ba ngôn ngữ ở mức người viết thạo, **không thay người bản xứ** (G5). Mục 9 là chỗ dễ sai nhất.
