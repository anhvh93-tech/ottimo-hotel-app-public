# Landing ottimo.vn – nhận phòng từ 12:00 và giá "từ" (FB-INV-004) – BẢN CHỐT cho FE-LP

- Người viết: CPY | Round 3 – bước Phản hồi & sửa | Ngày: 26/10/2026
- Việc: **F5** và **F9** của DOM (`rounds/round-03/outputs/DOM/v1-production-defaults.md` mục 8.3–8.5).
- Căn cứ:
  - BR v0.4.6: **BR-401** (e) – chữ khách thấy không hứa "sẵn sàng từ 12:00"; **BR-114** – giá "từ", câu điều kiện, một nguồn; BR-104, BR-113.
  - `04-investor-feedback/FB-INV-004.md`; decision-log INV 26/10 (đồng ý "chỉ từ" với con số DOM kiểm giá thật).
  - Brand Guidelines v1.0: EN dẫn, VI hỗ trợ; ngắn, điềm tĩnh; không emoji, không cảm thán, không IN HOA.
- Phạm vi: `product/apps/landing-web/src/content/en.ts`, `vi.ts`, `site.json`, `types.ts`, `components/home/Hero.astro`. CPY không sửa mã. FE-LP áp.
- Thời điểm áp:
  - **F5 trước ngày D 02/11** (trang đang chạy ghi 14:00).
  - **F9 sau ngày D**, khi INV đã tự kiểm điều khoản ngang giá OTA (BR-114 (5), ESC-035). F9 có thể nằm sẵn trong mã nhưng chỉ đăng khi INV báo xong.
- Ký hiệu `[[…]]` = đoạn không ngắt dòng (`lib/rich.ts`), như bản chốt 24/10.

---

## 1. F5 – Giờ nhận phòng

### 1.1 Câu chuẩn
Một câu, dùng ở mọi chỗ trên landing:
- EN: **Check-in from 12:00 when your room is ready; it always is by 14:00. Check-out by 12:00.**
- VI: **Nhận phòng từ 12:00 khi phòng đã sẵn sàng – và phòng luôn sẵn sàng lúc 14:00. Trả phòng trước 12:00.**

So với câu chuẩn của DOM (BR-401 (e)):
- Giữ đủ ba ý: từ 12:00, chắc chắn 14:00, trả 12:00.
- Chuyển ngoặc đơn và dấu "·" thành câu liền. Lý do: hai chỗ dùng đều là câu văn trong đoạn, không phải dòng thông số.
- Đã loại các cách viết dễ hiểu sai:
  - "always by 14:00" đứng sau "Check-in" → đọc thành "khách phải nhận phòng trước 14:00".
  - "muộn nhất 14:00" → cũng đọc thành hạn chót của khách.
  - "ready from 12:00" / "sẵn sàng từ 12:00" → hứa sai (BR-401 (e)).
- "when your room is ready" / "khi phòng đã sẵn sàng" nói thật điều kiện, giọng vẫn mời gọi. Không nhắc phụ thu nhận sớm trước 12:00: phí không nằm ở thân trang (INV 24/10). Sale báo khi khách hỏi.

### 1.2 Bảng khóa

| Khóa | Câu cũ | EN chốt | VI chốt | Lý do |
|---|---|---|---|---|
| `amenities.groups[3].body` (en.ts ~dòng 183, vi.ts ~183) | EN: A warm welcome at the ground-floor reception, [[07:00–22:00]], and a smart lock for late arrivals. Check-in from 14:00, check-out by 12:00. / VI: Lễ tân đón bạn ở tầng trệt, [[07:00–22:00]]; khóa điện tử để bạn đến muộn vẫn thong thả. Nhận phòng từ 14:00, trả phòng trước 12:00. | A warm welcome at the ground-floor reception, [[07:00–22:00]], and a smart lock for late arrivals. Check-in from 12:00 when your room is ready; it always is by 14:00. Check-out by 12:00. | Lễ tân đón bạn ở tầng trệt, [[07:00–22:00]]; khóa điện tử để bạn đến muộn vẫn thong thả. Nhận phòng từ 12:00 khi phòng đã sẵn sàng – và phòng luôn sẵn sàng lúc 14:00. Trả phòng trước 12:00. | BR-401 v0.4.6. Câu đầu giữ nguyên (test kiểm giờ lễ tân) |
| `faq.items[0].a[0]` (en.ts ~dòng 286, vi.ts ~285) | EN: … desk. Check-in from 14:00, check-out by 12:00. One night or several months, it simply works. / VI: … bàn làm việc riêng. Nhận phòng từ 14:00, trả phòng trước 12:00. Một đêm hay vài tháng, mọi thứ đều sẵn sàng. | The attentiveness of a reception and, for short stays, daily housekeeping, with the ease of your own kitchen, washer-dryer and desk. Check-in from 12:00 when your room is ready; it always is by 14:00. Check-out by 12:00. One night or several months, it simply works. | Sự chu đáo của lễ tân và, với kỳ ở ngắn, dọn phòng mỗi ngày; cùng sự tiện lợi của gian bếp, máy giặt sấy và bàn làm việc riêng. Nhận phòng từ 12:00 khi phòng đã sẵn sàng – và phòng luôn sẵn sàng lúc 14:00. Trả phòng trước 12:00. Một đêm hay vài tháng, mọi thứ đều chu toàn. | BR-401. VI câu cuối: đổi "đều sẵn sàng" thành "đều chu toàn" để không lặp "sẵn sàng" ba lần trong một đoạn |

### 1.3 `site.json` (FE-LP)
| Khóa | Hiện | Đổi | Ghi chú |
|---|---|---|---|
| `checkinTime` | `"14:00"` | **`"12:00"`** | JSON-LD Hotel (`lib/seo.ts`) tự theo |
| `roomReadyBy` (**MỚI**) | – | **`"14:00"`** | Mốc "chắc chắn sẵn sàng" (BR-401 (b)), cùng ý với khóa Desk `room_ready_guaranteed_time` (v1.0.1). Thêm vào `siteSchema`. Không đưa vào JSON-LD (schema.org không có trường này) |

Câu trong `en.ts`/`vi.ts` vẫn viết giờ bằng chữ như hiện nay. Test bảo đảm câu khớp `site.json` (mục 3).

---

## 2. F9 – Giá "từ"

### 2.1 Câu chốt

| Khóa (**MỚI**, kiểu hàm) | EN chốt | VI chốt |
|---|---|---|
| `hero.from(price)` | `Rates from [[${price}]] a night` → "Rates from 667,000 VND a night" | `Chỉ từ [[${price}]] mỗi đêm` → "Chỉ từ 667.000 đ mỗi đêm" |
| `hero.fromTerms(weekend)` | `For two, taxes included. Sunday to Thursday nights, booked direct. Weekends from [[${weekend}]], two nights minimum; holidays are higher.` | `Cho 2 khách, đã gồm thuế. Đêm Chủ nhật đến thứ Năm, đặt trực tiếp. Cuối tuần từ [[${weekend}]], tối thiểu 2 đêm; ngày lễ, Tết cao hơn.` |

- `price` = `booking.fromNightlyVnd`, `weekend` = `booking.fromWeekendNightlyVnd`, cả hai **đã định dạng kèm đơn vị** theo content-guide: EN "667,000 VND", VI "667.000 đ". Câu không tự viết "VND"/"đ" (cùng quy ước `common.currency_vnd`).
- Định dạng số: `Intl.NumberFormat('en-US')` / `('vi-VN')`, nối đơn vị. Không rút gọn "667k".

### 2.2 Vì sao viết vậy
- **"Rates from" (EN)**: cách các khách sạn, boutique stay cao cấp nói giá – bình thản, không chào hàng. Không dùng "Only", "just", "starting at just".
- **"Chỉ từ" (VI)**: INV chọn 26/10 (BR-114 (4)). Đi với "mỗi đêm" thay cho "/đêm" để câu đọc như lời nói, bớt giống nhãn giá. Không dùng "giá rẻ", "giá sốc", "ưu đãi", "phụ thu".
- **Con số thật, không làm tròn**: 667.000 là giá thật thấp nhất (BR-114 (1)). Số lẻ trông thật hơn số tròn 700.000. Đây cũng là lý do không đổi thành "dưới 700k".
- **Câu điều kiện đủ năm ý BR-114 (2)**: mỗi đêm · 2 khách · gồm thuế · đêm thường + đặt trực tiếp · cuối tuần và lễ cao hơn.
  - "Đêm Chủ nhật đến thứ Năm" thay cho "ngày thường": "ngày thường" dễ hiểu là thứ Hai – thứ Sáu, trong khi đêm thứ Sáu là giá cuối tuần (BR-104). Nói rõ thì trung thực hơn.
- **Có số cuối tuần (CPY quyết, BR-114 cho phép)**: khách staycation đi cuối tuần là nhóm INV muốn giữ.
  - Nếu chỉ thấy 667.000, khách nhắn Zalo hỏi cuối tuần và nghe 767.000 + tối thiểu 2 đêm → hụt hẫng, mất lòng tin ngay ở bước đầu.
  - Nói trước 767.000 vẫn là mức dễ chịu và giữ uy tín.
  - Theo BR-114 (2), có số cuối tuần thì phải kèm "tối thiểu 2 đêm" (BR-113).
- **"for two" / "Cho 2 khách"**: đúng định mức Studio (BR-110). Không nhắc người thứ 3 và mức thêm người: thuộc phần sale tư vấn.
- **Không dùng tên căn, số căn** ("101", "City View"): landing không nêu số căn (FB-INV-002). Câu "from" không cần chỉ hạng nào – hạng rẻ nhất tự lộ khi sale báo giá.

### 2.3 Vị trí – đề xuất
**Phương án chọn: Hero, ngay dưới `hero.lead`, trên hai nút "Plan your stay" / "Chat on Zalo".**

```
Boutique stay · Da Lat                       (hero.label)
A refined stay inspired by the calm spirit…  (H1)
Quiet, well-made rooms on a Da Lat hillside… (hero.lead)
Rates from 667,000 VND a night               (hero.from)       – Be Vietnam Pro 500, Ink, cỡ chữ thân
For two, taxes included. Sunday to …         (hero.fromTerms)  – Be Vietnam Pro 400, Stone Grey, cỡ nhỏ
[ Plan your stay ]  [ Chat on Zalo ]
```

- Lý do chọn Hero:
  - Mọi khách đều thấy ở màn đầu, đúng ý INV ("khách staycation không bỏ đi khi không thấy giá").
  - Đặt ngay trên nút chính → con số dẫn thẳng vào hành động "Plan your stay": thấy giá dễ chịu, bấm hỏi ngày.
  - Hero của landing là chữ cạnh ảnh, không chữ đè ảnh (`Hero.astro`) → hai dòng thêm không che ảnh.
- **Yêu cầu trình bày (UXD duyệt, FE-LP làm)**:
  - Con số **không** in to, không màu Oak/Earth làm điểm nhấn, không khung, không nhãn "Ưu đãi". Một dòng chữ thân, đậm vừa.
  - Dòng điều kiện liền ngay dưới, cùng khối. BR-114 (2): đọc được, không đưa xuống cuối trang, không dùng dấu `*`.
  - Đặt trong `<p class="from">` + `<p class="from-terms">`; render bằng `<Rich>` để `[[…]]` không ngắt dòng.
- **Phương án dự phòng – chỉ khi UXD đo thấy Hero trên di động (375 px) đẩy hai nút xuống dưới màn đầu**:
  - Chuyển cả hai dòng xuống đầu mục Phòng nghỉ, ngay dưới `rooms.intro`, trên lưới phòng.
  - Đổi tên khóa thành `rooms.from` / `rooms.fromTerms`, câu giữ nguyên.
  - Không tách con số và điều kiện ra hai chỗ.
- **Chỉ một chỗ trên trang.** Không lặp ở thẻ City Studio, `rooms.note`, Book, sticky bar.
  - Lặp thêm thì mỗi chỗ phải kèm đủ câu điều kiện (BR-114 (2)), trang nặng chữ giá – trái định vị.
  - `rooms.note` giữ nguyên ("Rates by the night or by the month, prepared for your dates.") – vẫn đúng: giá chính xác theo ngày ở do sale báo.
- **Không** đưa giá vào `meta.description`, ảnh OG, JSON-LD (`priceRange`): những chỗ đó không chứa nổi câu điều kiện và dễ cũ khi đổi giá.

### 2.4 `site.json` (FE-LP)
| Khóa | Giá trị | Nguồn |
|---|---|---|
| `booking.fromNightlyVnd` (**MỚI**) | `667000` | BR-114 (1): giá đêm Chủ nhật – thứ Năm thấp nhất, kênh Trực tiếp, định mức, gồm VAT 8 % |
| `booking.fromWeekendNightlyVnd` (**MỚI**) | `767000` | BR-114 (2): cùng cách tính, thứ Sáu/thứ Bảy +15 % (767.050 → 767.000 theo bảng DOM) |

Thêm vào `$comment` của `site.json`: "fromNightlyVnd / fromWeekendNightlyVnd = BR-114: change the same day the cheapest direct rate or VAT changes (OWN checks every price change and on the 1st of each month)."

---

## 3. Test FE-LP nên thêm (`src/content/copy.test.ts`, `scripts/dist-checks.mjs`)
1. **Giờ khớp `site.json`**: với cả EN và VI, `plain(amenities.groups[3].body)` và `plain(faq.items[0].a[0])` chứa `site.checkinTime`, `site.roomReadyBy`, `site.checkoutTime`; không còn "14:00" đứng sau "Check-in from" / "Nhận phòng từ".
2. **Cấm hứa sai**: thêm vào `BANNED` mẫu `/ready from \d|sẵn sàng từ \d/iu` (BR-401 (e)).
3. **Giá khớp `site.json`**: `plain(hero.from(fmt(b.fromNightlyVnd)))` chứa "667,000 VND" (EN) / "667.000 đ" (VI); `plain(hero.fromTerms(fmt(b.fromWeekendNightlyVnd)))` chứa số cuối tuần, "2" (khách) và "taxes included" / "đã gồm thuế".
4. **Thứ tự giá**: `fromNightlyVnd < fromWeekendNightlyVnd`, cả hai > 0 và là số nguyên.
5. Kiểm sẵn có vẫn đạt: không "!", không emoji, không "phụ thu", không "sang trọng" (cấm từ 24/10), không "căn".

## 4. Kiểm tay của CPY trên câu chốt
- Không còn "14:00" là giờ nhận phòng; "14:00" chỉ đi với "ready" / "sẵn sàng".
- Không câu nào hứa phòng sẵn sàng lúc 12:00.
- Không "giá rẻ", "giá sốc", "rẻ nhất", "ưu đãi", "phụ thu", "phí", "căn", "khách sạn", "homestay".
- Không emoji, không "!", không IN HOA. EN viết như bản gốc, VI viết lại cho tự nhiên ("mỗi đêm", "ngày lễ, Tết").
- Số tiền đúng định dạng content-guide; con số khớp bảng DOM 8.4.

## 5. Ghi chú cho các vai
- **UXD**: duyệt khối giá trong Hero (cỡ, màu theo bảng 80/15/5, khoảng cách tới nút); đo màn đầu ở 375 px để chọn Hero hay phương án dự phòng.
- **FE-LP**:
  - Áp F5 trước 02/11.
  - F9 làm sẵn sau công tắc hoặc nhánh riêng, đăng khi ORC báo INV đã kiểm ngang giá OTA.
  - Không viết số trong câu, chỉ đọc từ `site.json`.
- **DOM/OWN**: mỗi lần đổi giá căn rẻ nhất, VAT hay ngừng bán căn đó → sửa `site.json` cùng ngày (BR-114 (3)).
- **Ngoài landing** (không thuộc việc này): mẫu tin, trang khách (F3, F6) dùng cùng câu chuẩn 1.1 để khách đọc một giọng ở mọi nơi. UXD/INT có thể lấy nguyên câu.
