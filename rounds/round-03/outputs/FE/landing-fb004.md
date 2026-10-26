# FE-LP – Landing: nhận phòng từ 12:00 (F5) và giá "từ" (F9) – FB-INV-004

- Vai: FE-LP | Round 3 – bước Phản hồi & sửa | Ngày: 26/10/2026
- Căn cứ: CPY `rounds/round-03/outputs/CPY/landing-fb-inv-004.md` (bản chốt), BR-401 v0.4.6, BR-114, FB-INV-004.
- Hai commit tách riêng trên cùng nhánh:
  - **Commit 1 – F5** (giờ nhận phòng): đăng được ngay, **phải lên trước ngày D 02/11**.
  - **Commit 2 – F9** (giá "từ"): **CHƯA ĐĂNG** – chờ INV tự kiểm điều khoản ngang giá OTA (BR-114 (5), ESC-035). ORC chỉ đưa commit 2 lên khi INV báo xong.

## 1. F5 – Giờ nhận phòng (commit 1)

### Đã làm
- Câu chuẩn CPY 1.1, đúng từng chữ, ở hai chỗ, cả EN và VI:
  - `amenities.groups[3].body` (mục Amenities, nhóm lễ tân).
  - `faq.items[0].a[0]` (câu hỏi đầu của FAQ). VI đổi luôn câu cuối "đều sẵn sàng" → "đều chu toàn" theo bản chốt.
- `site.json`: `checkinTime` "14:00" → **"12:00"**; thêm **`roomReadyBy` = "14:00"** (kèm ghi chú trong `$comment`). `siteSchema` (`site.ts`) có trường mới, kiểm định dạng giờ.
- JSON-LD `LodgingBusiness` tự theo: `checkinTime` = "12:00", `checkoutTime` = "12:00"; `roomReadyBy` không vào JSON-LD (schema.org không có trường này).
- Danh sách cấm `BANNED` (`scripts/dist-checks.mjs`) thêm `/ready from \d|sẵn sàng từ \d/iu` (BR-401 (e)). Danh sách này chạy cả trên nguồn chữ (Vitest) lẫn HTML/meta/JSON-LD của dist.
- README: ghi nghĩa hai khóa giờ.

### Test thêm (`src/content/copy.test.ts`)
- EN/VI: câu ở Amenities và FAQ chứa `checkinTime`, `roomReadyBy`, `checkoutTime` của `site.json`, đúng câu chuẩn dựng từ ba giá trị đó; không còn "Check-in from 14:00" / "Nhận phòng từ 14:00".
- Mẫu cấm bắt "ready from 12:00" / "sẵn sàng từ 12:00", không bắt câu chuẩn ("always is by 14:00", "luôn sẵn sàng lúc 14:00").
- JSON-LD: `checkinTime`/`checkoutTime` = `site.json`, không có `roomReady` hay "14:00".

## 2. F9 – Giá "từ" (commit 2 – CHƯA ĐĂNG)

### Đã làm
- `site.json` → `booking.fromNightlyVnd` = **667000**, `booking.fromWeekendNightlyVnd` = **767000**; `$comment` thêm câu BR-114 của CPY. `siteSchema`: VND nguyên dương, giá thường < giá cuối tuần (sai thì build dừng).
- `src/lib/price.ts` → `formatVnd(amount, lang)`: EN "667,000 VND", VI "667.000 đ" (`Intl.NumberFormat` en-US / vi-VN, nối đơn vị, không rút gọn "667k").
- Câu đúng bản chốt CPY 2.1, kiểu hàm, giá trong `[[…]]` (không ngắt dòng): EN "Rates from 667,000 VND a night" + "For two, taxes included. Sunday to Thursday nights, booked direct. Weekends from 767,000 VND, two nights minimum; holidays are higher."; VI "Chỉ từ 667.000 đ mỗi đêm" + "Cho 2 khách, đã gồm thuế. Đêm Chủ nhật đến thứ Năm, đặt trực tiếp. Cuối tuần từ 767.000 đ, tối thiểu 2 đêm; ngày lễ, Tết cao hơn."
- Trình bày: `<p class="from">` Be Vietnam Pro 500, cỡ chữ thân, Ink; `<p class="from-terms">` Be Vietnam Pro 400, cỡ nhỏ, Stone (4,5:1 trên nền Cream), ngay dưới. Không Oak/Earth, không khung, không nhãn, không dấu `*`.

### Vị trí: dùng phương án dự phòng của CPY (đầu mục Rooms)
Đo trên bản dựng thật (Playwright, đáy nút thứ hai của Hero so với chiều cao màn hình):

| Khung | Không có khối giá | Khối giá ở Hero | Khối giá ở Rooms (đã chọn) |
|---|---|---|---|
| EN 375×812 | 769 – trong màn đầu | 897 – **ra ngoài** | 769 – trong |
| VI 375×812 | 769 – trong | 876 – **ra ngoài** | 769 – trong |
| EN/VI 390×844 | 739 – trong | 846 – **ra ngoài** | 739 – trong |
| 1280×800, 1440×900 | trong | trong | trong |

- Hero làm hai nút rơi khỏi màn đầu ở 375 px → theo CPY 2.3, khóa đổi thành `rooms.from` / `rooms.fromTerms`, đặt dưới `rooms.intro`, trên lưới phòng. Con số và câu điều kiện đi cùng một khối.
- Ở 375×667 và 360×740, hai nút Hero vốn đã nằm dưới màn đầu từ trước (769/759 px). Không do việc này.
- Một chỗ duy nhất trên trang. Không lặp ở thẻ City Studio, `rooms.note`, Book, thanh đáy.

### Test thêm
- `copy.test.ts`:
  - Hai số đúng BR-114, VND nguyên, thường < cuối tuần; schema từ chối khi đảo hai số hoặc khi số lẻ.
  - `formatVnd` cho đủ hai dạng, không rút gọn.
  - Câu EN/VI chứa đúng số định dạng từ `site.json`, có "For two/Cho 2 khách", "taxes included/đã gồm thuế", "two nights minimum/tối thiểu 2 đêm".
  - Câu không tự viết số hay đơn vị. Không "!", emoji, `*`, "only/just/giá rẻ/ưu đãi/phí", danh sách cấm.
  - Meta title/description và JSON-LD không có số tiền.
- `dist-checks.mjs` (`checkSeo`): title, mọi thẻ `<meta>` (description, OG, Twitter) và JSON-LD không được có số tiền (`MONEY`) hay `priceRange`/`offers`.
- `dist.test.ts` (cả 3 bản dựng): mỗi trang chủ có đúng một `data-from`, nằm trong `#rooms` trước lưới, chứa đúng hai số; mỗi số xuất hiện một lần trên trang; trang khác không có.

## 3. Kiểm tra (sau commit 2, cả hai commit)
- `prettier --check`, `eslint` (landing + e2e landing): sạch.
- `astro check`: 0 lỗi, 0 cảnh báo (65 tệp).
- Vitest landing: commit 1 có 208/208 đạt; commit 2 có 216/216 đạt (copy test 40/40). Gồm kiểm dist trên `dist`, `dist-booking-preview`, `dist-booking-live`: CSP, không tài nguyên ngoài, màu, ngân sách byte, glyph.
- Playwright landing: 54/54 đạt ở cả hai commit. Gồm axe 0 lỗi, CSP sạch, không cuộn ngang 320/375/768/1280 × EN/VI, ngân sách byte theo DPR. Không nới ngưỡng nào.

## 4. Ảnh chụp – `rounds/round-03/outputs/FE/landing-fb004-shots/`
- `hero-{en,vi}-{1440,390}.png`: màn đầu, có commit 2. Hero không đổi; hai nút trong màn đầu.
- `rooms-from-{en,vi}-{1440,390}.png`: khối giá ở đầu mục Rooms.
- `amenities-{en,vi}-{1440,390}.png`, `faq1-{en,vi}-{1440,390}.png`: câu giờ nhận phòng mới.
- `hero-variant-not-used-{en,vi}-375.png`: bằng chứng phương án Hero. Khối giá được chuyển tạm lên Hero trong trình duyệt; ở 375×812 hai nút bị đẩy xuống dưới màn đầu.

## 5. Giả định · Rủi ro · Việc chưa xong
- **Giả định**: "màn đầu 375 px" đo ở 375×812, khung mà e2e landing dùng. Khung thấp hơn (667) thì nút Hero vốn đã dưới màn đầu.
- **Giả định**: "for two" / "Cho 2 khách" là định mức Studio (BR-110), như CPY ghi. FE không kiểm lại giá.
- **Chưa xong / chờ**:
  - UXD duyệt khối giá: cỡ, màu, khoảng cách, vị trí Rooms.
  - INV kiểm ngang giá OTA (ESC-035) trước khi đăng commit 2.
  - DOM/OWN sửa `site.json` cùng ngày khi giá rẻ nhất hoặc VAT đổi.
- **Rủi ro**: nếu chỉ đưa commit 1 lên trước ngày D, commit 2 phải giữ nguyên thứ tự. Commit 2 chỉ thêm, không sửa chữ của commit 1, nên cherry-pick riêng commit 1 an toàn.
